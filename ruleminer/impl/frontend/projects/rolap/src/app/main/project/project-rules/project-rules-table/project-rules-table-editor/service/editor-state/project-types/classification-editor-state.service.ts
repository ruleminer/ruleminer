import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, Observable, catchError, combineLatest, map, mergeMap, of, take } from 'rxjs';

import { ErrorResponse } from '../../../../../../../../common/interfaces/error-response.model';
import { mapBackendColumnNameToTranslateValue } from '../../../../../../../../common/utils/dataGridUtils';
import { ProblemTypes } from '../../../../../../../data-upload/utils/enums';
import { ProjectService } from '../../../../../../service/project.service';
import { BaseEditorStateService } from '../editor-state.service';
import { ConclusionEditorState } from '../types';
import { Subcondition } from '../../../types/rules-editor';

/**
 * @Service ClassificationEditorStateService
 * @description Manages the state and logic for the rule editor specifically for Classification projects.
 *              Inherits common functionalities from BaseEditorStateService and implements Classification-specific behaviors.
 */
@Injectable({
  providedIn: 'root',
})
export class ClassificationEditorStateService extends BaseEditorStateService {
  private projectService = inject(ProjectService);
  override problemType = ProblemTypes.Classification;

  /**
   * @computed conclusionDropDownItemsSignal
   * @description A computed signal that provides the dropdown items for the "Rule Conclusion" dropdown
   * in the ClassificationRuleConclusionEditorComponent.
   */
  override conclusionDropDownItemsSignal = computed(() => {
    const nominalAttributes = this.nominalAttributesSig();
    const decisionAttribute = this.decisionAttributeSig();
    if (!decisionAttribute) return [];
    return nominalAttributes?.[decisionAttribute] || [];
  });

  override actualRuleString = computed(() => {
    const subconditions = this.subconditionsSignal();
    let conclusion = this.editorConclusionState();
    const decisionAttributeName = this.decisionAttributeSig();

    if (!subconditions?.length || !conclusion || !decisionAttributeName || !this.problemType) {
      return '';
    }

    conclusion = Array.isArray(conclusion) ? conclusion[0] : conclusion;


    const attributeNames = this.allAttributesNamesSignal()
    const allAttributesSig = this.allAttributesSig();
    if (!attributeNames || !allAttributesSig) {
      return '';
    }


    if (!subconditions?.length || !conclusion || !decisionAttributeName || !this.problemType || conclusion.value === null || !attributeNames) {
      return '';
    }
    return this.rulesEditorService.createRuleString(
      this.problemType,
      subconditions,
      attributeNames,
      conclusion,
      decisionAttributeName,
      allAttributesSig
    );
  });

  /**
   * @constructor
   * @description Constructor for `ClassificationEditorStateService`.
   *              It calls the constructor of the base class (`BaseEditorStateService`) and sets up effects for data fetching and initialization.
   */
  constructor() {
    super();

    this.setupFetchRuleMetricsEffect();
    this.setupFetchClassDistributionEffect();
    this.setupInitialConclusionDropdownEffect();
    this.setupConditionCoverageEffect();
  }

  /**
   * @effect - Fetch Rule Metrics
   * @description An effect that fetches rule metrics when certain signals change
   *              (`dataSetIdSig`, `ruleSig`, `allAttributesSig`, `editorConclusionState`).
   *               It updates the `displayedMetrics` signal with the fetched metrics.
   */
  private setupFetchRuleMetricsEffect(): void {
    effect(
      () => {
        const isDxListEmptySignal = this.isDxListEmptySignal();
        const conditionCoverageLoading = this.conditionCoverageLoading();

        if (isDxListEmptySignal || conditionCoverageLoading) return;

        const dataSetId = this.dataSetIdSig();
        const rule = this.ruleSig();
        const attributes = this.allAttributesSig();
        const editorConclusionState = this.editorConclusionState();

        if (!editorConclusionState) return;
        const editorConclusionStateObj = Array.isArray(editorConclusionState)
          ? editorConclusionState[0]
          : editorConclusionState;

        if (!dataSetId || !attributes || !editorConclusionState || editorConclusionStateObj.value === null) return;

        const attributesNames = attributes.map((a: any) => a.name);

        const premise = (rule as any).premise[0];
        const ruleForBackend = {
          ...rule,
          premise,
          conclusion: editorConclusionStateObj,
        };

        const metrics$ = this.metricsService
          .getRulesMetrics(dataSetId, ruleForBackend, attributesNames, this.problemType)
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
          }
        });
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * @effect - Fetch Class Distribution
   * @description Effect that fetches class distribution data when `dataSetIdSig` changes
   *              and updates `distributionSignal` with the fetched data for Classification projects.
   */
  private setupFetchClassDistributionEffect(): void {
    effect(
      () => {
        const dataSetId = this.dataSetIdSig();

        if (!dataSetId) return;
        //TODO: datasetService.getClassDistribution could be in store
        this.datasetService
          .getClassDistribution(dataSetId)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(() => of(null)),
          )
          .subscribe((response) => {
            this.distributionSignal.set(response);
          });
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * @effect - Set Initial Conclusion Dropdown Value
   * @description Effect that sets the initial value for the "Rule Conclusion" dropdown
   *              It selects the first available class from `conclusionDropDownItemsSignal` if no value is selected.
   */
  private setupInitialConclusionDropdownEffect(): void {
    effect(
      () => {
        const possibleClasses = this.conclusionDropDownItemsSignal();
        const conclusion = this.conclusionSignal();

        const selectedValue = this.editorConclusionState();
        if (possibleClasses.length && selectedValue === null && typeof possibleClasses[0] === 'string') {
          const initialClassificationValue = conclusion || { value: possibleClasses[0] };
          if (initialClassificationValue) {
            this.setEditorConclusionState(initialClassificationValue);
          }
        }
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * @private setupConditionCoverageEffect
   * @description Monitors signals and calculates condition coverage for the rule.
   *
   * **Triggers:**
   * - Changes in attribute names, rule, dataset ID, conclusion dropdown, DxList values, display type, or config.
   *
   * **Actions:**
   * 1. **Check for Value Change:** Determines if values have changed, preventing unnecessary backend calls.
   * 2. **Update Conditions:** Converts attribute names to indices for backend compatibility.
   * 3. **Fetch Coverage Data:** Sends a request to fetch condition coverage from the backend.
   * 4. **Handle Response:** On success, updates relevant signals and metrics. On error, restores previous values and handles specific errors like 'no examples covered'.
   */
  private setupConditionCoverageEffect() {
    effect(
      () => {
        const isDxListEmptySignal = this.isDxListEmptySignal();
        if (isDxListEmptySignal) return;
        const attributeNames = this.allAttributesNamesSignal();
        const rule = this.ruleSig();
        const conditions = rule?.premise;
        const dataSetId = this.dataSetIdSig();
        const editorConclusionState = this.editorConclusionState();
        const lastSuccesfullConclusionEditrorSelected = this.lastSuccesfullEditorConclusionState();
        const listValueObject = this.listValueObjectSignal();
        const displayType = this.displayTypeSig();
        const config = this.configSignal();

        if (!displayType || !dataSetId || !attributeNames) return;
        if (attributeNames.length === 0) return;

        const hasValueChanged = (): boolean => {
          const hasNoExamplesCoveredError = this.hasNoExamplesCoveredError();
          const lastObj = Array.isArray(lastSuccesfullConclusionEditrorSelected)
            ? lastSuccesfullConclusionEditrorSelected[0]
            : lastSuccesfullConclusionEditrorSelected;
          const currObj = Array.isArray(editorConclusionState) ? editorConclusionState[0] : editorConclusionState;
          const didConclusionDropdownChange = lastObj?.value !== currObj?.value;
          return (
            didConclusionDropdownChange ||
            ((listValueObject?.didChange ?? false))
          );
        };

        const updateConditions = (): any[] => {
          return (
            (conditions as any as Subcondition[])?.map((condition: any) => {
              if (condition.attributes && typeof condition.attributes[0] === 'string') {
                const attributeIndex = attributeNames?.indexOf(condition.attributes[0]);
                return {
                  ...condition,
                  attributes: [attributeIndex],
                };
              }
              return condition;
            }) || []
          );
        };

        const prepareRequest = (): Observable<any> => {
          const hasValueChangedVal = hasValueChanged();
          if (!hasValueChangedVal) return EMPTY;
          const updatedConditions = updateConditions();
          const data = {
            meta: {
              attributes: attributeNames ?? [],
            },
            conditions: [updatedConditions],
          }
         return this.projectService.getConditionsCoverage(dataSetId, data);
        };

        const request = prepareRequest();
        this.conditionCoverageLoading.set(true);
        request.subscribe({
          next: (response: any | null) => {
            this.hasNoExamplesCoveredError.set(false);

            if (listValueObject) {

              this.listValueObjectSignal.update(() => {
                return {
                  value: listValueObject.value, didChange: false
                }
              })
            }

            this.lastSuccesfullEditorConclusionState.set(editorConclusionState as any);

            if (response) {
              this.coverage.set(response);

              const configIsEdit = config?.isEdit;
              this.conditionCoverageLoading.set(false);
              if (!response || this.originalRuleCoverageSig() || !configIsEdit) return;
              this.setOriginalRuleCoverageSig(response[0]);
            }


          },
          error: (httpError: HttpErrorResponse) => {
            const errorMsgId = (httpError.error as ErrorResponse).err_msg_id;
            if (errorMsgId !== this.NO_EXAMPLES_COVERED_ERROR) {
              const lastObj = Array.isArray(lastSuccesfullConclusionEditrorSelected)
                ? lastSuccesfullConclusionEditrorSelected[0]
                : lastSuccesfullConclusionEditrorSelected;
              const currObj = Array.isArray(editorConclusionState) ? editorConclusionState[0] : editorConclusionState;
              if (lastObj?.value !== currObj?.value) {
                this.editorConclusionState.set(lastSuccesfullConclusionEditrorSelected);
              }

              this.hasNoExamplesCoveredError.set(false);
              this.conditionCoverageLoading.set(false);
            } else {
              this.hasNoExamplesCoveredError.set(true);
              this.conditionCoverageLoading.set(false);
            }

            this.updateOnEmptyCoverage();
          },
        });
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * @override setEditorConclusionState
   * @description In Classification when values is an array with one object we do not want to pass it as array but as object
   * @param value ConclusionEditorState - The value to set for editorConclusionState signal.
   */
  override setEditorConclusionState(value: ConclusionEditorState) {
    if (Array.isArray(value) && value.length < 2) {
      value = value[0];
    }
    this.editorConclusionState.set(value);
  }
}
