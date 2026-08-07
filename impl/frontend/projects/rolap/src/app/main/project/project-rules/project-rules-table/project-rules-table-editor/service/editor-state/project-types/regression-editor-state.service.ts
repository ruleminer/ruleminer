import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { catchError, combineLatest, map, mergeMap, of, take } from 'rxjs';

import { isEqual } from 'lodash';

import { ErrorResponse } from '../../../../../../../../common/interfaces/error-response.model';
import { mapBackendColumnNameToTranslateValue } from '../../../../../../../../common/utils/dataGridUtils';
import { ProblemTypes } from '../../../../../../../data-upload/utils/enums';
import {
  ConclusionTypes,
  RegressionConclusionValue,
} from '../../../rules-editor-side-column/rule-conclusion-editor/regression/models/conclusion';
import { REGRESSION_CONCLUSION_FIELD_TYPES } from '../../../rules-editor-side-column/rule-conclusion-editor/regression/regression-rule-conclusion-editor.component';
import { RulesTableEditorModalSettings } from '../../../types/rules-editor';
import { BaseEditorStateService } from '../editor-state.service';
import { ConclusionEditorStates, ListValueObject } from '../types';

/**
 * @Service RegressionEditorStateService
 * @description Manages state and logic for rule editor specifically for Regression projects.
 *              Extends BaseEditorStateService with regression-specific implementations.
 */
@Injectable({
  providedIn: 'root',
})
export class RegressionEditorStateService extends BaseEditorStateService {
  override problemType = ProblemTypes.Regression;
  override editorConclusionState = signal<ConclusionEditorStates[ProblemTypes.Regression]>(null);
  override lastSuccesfullEditorConclusionState = signal<ConclusionEditorStates[ProblemTypes.Regression]>(null);

  private isProcessingCoverage = signal<boolean>(false);

  /**
   * @computed conclusionDropDownItemsSignal
   * @description Provides dropdown items for regression conclusion type selection (Automatic/Manual)
   */
  override conclusionDropDownItemsSignal = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _onLangChange = this.onLangChangeSignal();
    return [
      {
        label: this.translate.instant('project.rules.rule_editor.regression_conclusion.automatic'),
        value: ConclusionTypes.AUTOMATIC,
      },
      {
        label: this.translate.instant('project.rules.rule_editor.regression_conclusion.manual'),
        value: ConclusionTypes.MANUAL,
      },
    ];
  });

  constructor() {
    super();
    this.setupFetchRuleMetricsEffect();
    this.setupConditionCoverageEffect();
  }

  /**
   * @private setupFetchRuleMetricsEffect
   * @description Sets up an effect to fetch and process rule metrics for regression.
   *              Only fetches metrics when necessary and when coverage calculation isn't in progress.
   */
  private setupFetchRuleMetricsEffect(): void {
    effect(
      () => {
        const isDxListEmptySignal = this.isDxListEmptySignal();
        const conditionCoverageLoading = this.conditionCoverageLoading();
        const isProcessing = this.isProcessingCoverage();

        if (isDxListEmptySignal || conditionCoverageLoading || isProcessing) return;

        const dataSetId = this.dataSetIdSig();
        const rule = this.ruleSig() || {};
        const attributes = this.allAttributesSig();
        const editorConclusionState = this.editorConclusionState();

        if (!editorConclusionState || editorConclusionState.value === null) {
          this.displayedMetrics.set([]);
          this.rawRuleMetrics.set([]);
          return;
        }

        if (!dataSetId || !attributes) return;

        const attributesNames = attributes.map((a: any) => a.name);
        const premise = ((rule as any).premise as any)[0];
        const ruleForBackend = {
          ...rule,
          premise,
          conclusion: editorConclusionState,
        };

        const metrics$ = this.metricsService
          .getRulesMetrics(dataSetId, ruleForBackend, attributesNames, ProblemTypes.Regression)
          .pipe(
            take(1),
            mergeMap((metrics) => {
              this.rawRuleMetrics.set(metrics);
              return combineLatest([of(metrics), this.metricsToDisplay$()]);
            }),
            map(([metrics, metricsToDisplay]) => {
              const converterColumnName = metricsToDisplay.map((m) => mapBackendColumnNameToTranslateValue(m));
              return metrics.filter((m) => converterColumnName.includes(m.name));
            }),
            catchError((err) => {
              console.error(err);
              this.rawRuleMetrics.set([]);
              this.displayedMetrics.set([]);
              this.hasNoExamplesCoveredError.set(true);
              return of([]);
            }),
            takeUntilDestroyed(this.destroyRef),
          );

        metrics$.pipe(take(1)).subscribe((metrics) => {
          if (metrics) {
            this.displayedMetrics.set(metrics);
          } else {
            this.displayedMetrics.set([]);
          }
        });
      },
      { allowSignalWrites: true },
    );
  }

  override setModalSettings(
    settings: RulesTableEditorModalSettings & { regressionConclusionType?: ConclusionTypes },
  ): void {
    super.setModalSettings(settings);
    // Initialize conclusion directly instead of via separate effects
    const existing = settings.selectedRow?.conclusion as RegressionConclusionValue | undefined;
    if (existing) {
      // Clone to detach from table row reference
      this.editorConclusionState.set({ ...existing });
      if (!existing.fixed) {
        this.lastSuccesfullEditorConclusionState.set(null);
      } else {
        this.lastSuccesfullEditorConclusionState.set({ ...existing });
      }
      return;
    }
    // New rule: decide initial fixed from optional regressionConclusionType; default automatic (false)
    const fixed = settings.regressionConclusionType === ConclusionTypes.MANUAL;
    this.editorConclusionState.set({
      value: null,
      low: null,
      high: null,
      fixed,
      train_covered_y_min: null,
      train_covered_y_max: null,
      train_covered_y_std: null,
      train_covered_y_mean: null,
    });
  }

  /**
   * @private setupConditionCoverageEffect
   * @description Monitors signals and calculates condition coverage for the rule.
   */
  private setupConditionCoverageEffect(): void {
    effect(
      () => {
        if (this.isDxListEmptySignal()) return;

        const attributeNames = this.allAttributesNamesSignal();
        const rule = this.ruleSig();
        const dataSetId = this.dataSetIdSig();
        const currentEditorConclusionState = this.editorConclusionState();
        const currentLastSuccessfulState = this.lastSuccesfullEditorConclusionState();
        const currentDxListValueObject = this.listValueObjectSignal();
        const displayType = this.displayTypeSig();
        const config = this.configSignal();

        if (!displayType || !dataSetId || !attributeNames || !currentEditorConclusionState) {
          this.resetDxListFlagIfNeeded(currentDxListValueObject);
          return;
        }

        if (this.isProcessingCoverage()) return;

        const { shouldCalculate, isManualSwitch } = this.checkIfValueChanged(
          currentEditorConclusionState,
          currentLastSuccessfulState,
          currentDxListValueObject,
        );

        this.resetDxListFlagIfNeeded(currentDxListValueObject);

        if (isManualSwitch) {
          if (!isEqual(currentEditorConclusionState, currentLastSuccessfulState)) {
            this.lastSuccesfullEditorConclusionState.set(currentEditorConclusionState);
          }
          // shouldCalculate = false;
        }

        if (!shouldCalculate) return;

        const premise = rule?.premise as any;
        const coverageRule = { ...rule, premise };
        if (!coverageRule.premise) return;

        this.isProcessingCoverage.set(true);
        this.conditionCoverageLoading.set(true);

        this.regessionRuleConclusionService
          .calculateRegressionConclusion(coverageRule as any, dataSetId, attributeNames || [])
          .pipe(take(1))
          .subscribe({
            next: (response: RegressionConclusionValue | null) => {
              this.resetDxListFlagIfNeeded(currentDxListValueObject);
              this.conditionCoverageLoading.set(false);
              this.isProcessingCoverage.set(false);

              if (response === null) return;

              const apiResponseConclusion = response as RegressionConclusionValue;

              this.hasNoExamplesCoveredError.set(false);
              this.coverage.set(apiResponseConclusion);

              if (currentEditorConclusionState?.fixed === false) {
                this.editorConclusionState.set(apiResponseConclusion);
                this.lastSuccesfullEditorConclusionState.set(apiResponseConclusion);
              } else {
                if (
                  currentEditorConclusionState &&
                  !isEqual(currentEditorConclusionState, currentLastSuccessfulState)
                ) {
                  this.lastSuccesfullEditorConclusionState.set(currentEditorConclusionState);
                }
              }

              const currentConfigIsEdit = config?.isEdit ?? false;
              const currentOriginalCoverage = this.originalRuleCoverageSig();
              if (currentConfigIsEdit && !currentOriginalCoverage) {
                this.setOriginalRuleCoverageSig(apiResponseConclusion as any);
              }
            },
            error: (httpError: HttpErrorResponse) => {
              this.resetDxListFlagIfNeeded(currentDxListValueObject);
              this.conditionCoverageLoading.set(false);
              this.isProcessingCoverage.set(false);

              const errorCode = (httpError.error as ErrorResponse)?.err_msg_id;
              if (errorCode === this.NO_EXAMPLES_COVERED_ERROR) {
                this.handleNoExamplesCoveredError(currentEditorConclusionState);
              } else {
                this.hasNoExamplesCoveredError.set(false);
                this.conditionCoverageLoading.set(false);
              }
            },
          });
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * @private checkIfValueChanged
   * @description Checks if conditions warrant recalculating coverage.
   * @returns Object { shouldCalculate: boolean, isManualSwitch: boolean }
   */
  private checkIfValueChanged(
    currentEditorConclusionState: RegressionConclusionValue | null,
    currentLastSuccessfulState: RegressionConclusionValue | null,
    listValueObject: ListValueObject | null,
  ): { shouldCalculate: boolean; isManualSwitch: boolean } {
    if (!currentEditorConclusionState) {
      return { shouldCalculate: false, isManualSwitch: false };
    }

    const isConclusionTypeAutomatic = currentEditorConclusionState.fixed === false;
    const conditionsChanged = listValueObject?.didChange ?? false;
    const didTypeChangeFromManualToAutomatic =
      currentLastSuccessfulState?.fixed === true && currentEditorConclusionState.fixed === false;
    const didTypeChangeFromAutomaticToManual =
      currentLastSuccessfulState?.fixed === false && currentEditorConclusionState.fixed === true;

    if (isConclusionTypeAutomatic && currentLastSuccessfulState === null) {
      return { shouldCalculate: true, isManualSwitch: false };
    }
    if (didTypeChangeFromAutomaticToManual) {
      return { shouldCalculate: false, isManualSwitch: true };
    }

    let shouldTrigger = false;
    if (isConclusionTypeAutomatic) {
      shouldTrigger = conditionsChanged || didTypeChangeFromManualToAutomatic;
    } else {
      shouldTrigger = conditionsChanged;
    }
    return { shouldCalculate: shouldTrigger, isManualSwitch: false };
  }

  /**
   * @private resetDxListFlagIfNeeded
   * @description Resets the dxListValueObjectSignal flag if it was set.
   */
  private resetDxListFlagIfNeeded(listValueObject: ListValueObject): void {
    if (listValueObject?.didChange) {
      this.listValueObjectSignal.update(() => {
        return {
          value: listValueObject.value,
          didChange: false,
        };
      });
    }
  }

  /**
   * @private handleNoExamplesCoveredError
   * @description Specific handler for NO_EXAMPLES_COVERED error.
   */
  private handleNoExamplesCoveredError(editorConclusionStateAtTimeOfError: RegressionConclusionValue | null): void {
    this.hasNoExamplesCoveredError.set(true);
    this.conditionCoverageLoading.set(false);
    this.coverage.set(null);
    this.updateOnEmptyCoverage();

    if (editorConclusionStateAtTimeOfError && !editorConclusionStateAtTimeOfError.fixed) {
      const resetConclusion: RegressionConclusionValue = {
        ...editorConclusionStateAtTimeOfError,
        value: null,
        low: null,
        high: null,
        train_covered_y_mean: null,
        train_covered_y_min: null,
        train_covered_y_max: null,
        train_covered_y_std: null,
      };
      this.editorConclusionState.set(resetConclusion);
      this.lastSuccesfullEditorConclusionState.set(resetConclusion);
    }
  }

  /**
   * @override regressionConclusionTypeChange
   * @description Updates the conclusion type (MANUAL / AUTOMATIC) and sets the fixed status.
   *              Changes the 'fixed' flag to true when Manual conclusion type is selected.
   *
   * @param selectedConclusionType - The newly selected conclusion type
   */
  override regressionConclusionTypeChange(selectedConclusionType: ConclusionTypes): void {
    const currentConclusion = this.editorConclusionState();
    if (!currentConclusion) return;

    const newFixedStatus = selectedConclusionType === ConclusionTypes.MANUAL;
    if (currentConclusion.fixed === newFixedStatus) return;

    const updatedConclusion = {
      ...currentConclusion,
      fixed: newFixedStatus,
    };
    this.editorConclusionState.set(updatedConclusion);
  }

  /**
   * @override regresionConclusionInputChange
   * @description Handles changes to the Regression Conclusion number Input fields (low, value, high).
   *              Updates the editorConclusionState signal with the new input value for the specified field.
   *              This method is specific to Regression projects and is called when the user modifies on of the input
   *              fields (low, value, high) in the RegressionRuleConclusionEditorComponent (when Manual conclusion type is selected).
   *              It also sanitizes the input values to ensure that 'low' <= 'value' <= 'high' constraints are maintained.
   *
   * @param value number - The new input value entered by the user.
   * @param fieldType REGRESSION_CONCLUSION_FIELD_TYPES - The specific field type that was changed (e.g., 'value', 'low', 'high').
   */
  override regresionConclusionInputChange(
    value: number,
    fieldType:
      | REGRESSION_CONCLUSION_FIELD_TYPES.LOW
      | REGRESSION_CONCLUSION_FIELD_TYPES.VALUE
      | REGRESSION_CONCLUSION_FIELD_TYPES.HIGH,
  ): void {
    const currentConclusion = this.editorConclusionState();
    if (!currentConclusion) return;

    const updatedConclusion = {
      ...currentConclusion,
      low: currentConclusion.low ?? 0,
      high: currentConclusion.high ?? 0,
      value: currentConclusion.value ?? 0,
      fixed: currentConclusion.fixed,
      [fieldType]: value,
    };

    if (updatedConclusion.low >= updatedConclusion.value) {
      updatedConclusion.low = updatedConclusion.value;
    }
    if (updatedConclusion.high <= updatedConclusion.value) {
      updatedConclusion.high = updatedConclusion.value;
    }

    this.editorConclusionState.set(updatedConclusion);
  }

  override resetValues(): void {
    this.isProcessingCoverage.set(false);
    super.resetValues();
  }
}
