import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, Observable, catchError, combineLatest, map, mergeMap, of, take } from 'rxjs';

import { v4 as uuidv4 } from 'uuid';

import { ErrorResponse } from '../../../../../../../../common/interfaces/error-response.model';
import { mapBackendColumnNameToTranslateValue } from '../../../../../../../../common/utils/dataGridUtils';
import { ProblemTypes } from '../../../../../../../data-upload/utils/enums';
import { Rule } from '../../../../../../models/ruleset';
import { ProjectService } from '../../../../../../service/project.service';
import { BaseEditorStateService } from '../editor-state.service';
import { ConclusionEditorSurviavalObject } from '../types';

/**
 * @Service SurvivalEditorStateService
 * @description Manages the state and logic for the rule editor specifically for Classification projects.
 *              Inherits common functionalities from BaseEditorStateService and implements Survival-specific behaviors.
 */
@Injectable({ providedIn: 'root' })
export class SurvivalEditorStateService extends BaseEditorStateService {
  override problemType = ProblemTypes.Survival;
  private projectService = inject(ProjectService);

  // Rule sig for survival
  override ruleSig = computed<Rule | null>(() => {
    const attributeNames = this.allAttributesNamesSignal();
    const config = this.configSignal();
    const subconditions = this.subconditionsSignal();


    const editorConclusionState = this.editorConclusionState();
    const uuid = this.uuidSignal();

    if (!attributeNames || !config || !subconditions || !editorConclusionState) return null;

    let conclusion = null;

    const transformConclusion = (editorConclusionState: any): any => {
      const kmData = editorConclusionState && editorConclusionState[0];
      if (!kmData) {
        throw new Error('Survival conclusion data is missing or invalid.  Returning null.');
      }

      return {
        value: kmData.median_survival_time,
        median_survival_time_ci_lower: kmData.median_survival_time_ci_lower,
        median_survival_time_ci_upper: kmData.median_survival_time_ci_upper,
        fixed: false,
      };
    };

    conclusion = transformConclusion(editorConclusionState);

    const ruleObjectUuid = config.isEdit ? uuid : uuidv4();

    const ruleObject = this.rulesEditorService.createRuleObject(
      ruleObjectUuid as string,
      subconditions,
      conclusion,
      attributeNames,
    );

    return ruleObject;
  });

  constructor() {
    super();
    this.setupFetchRuleMetricsEffect();
    this.setupConditionCoverageEffect();
  }

  /**
   * @effect - Fetch Rule Metrics
   * @description An effect that fetches rule metrics when certain signals change
   *              (`dataSetIdSig`, `ruleSig`, `allAttributesSig`, `editorConclusionState`).
   *               It updates the `displayedMetrics` signal with the fetched metrics.
   */
  private setupFetchRuleMetricsEffect() {
    effect(
      () => {
        if (this.isDxListEmptySignal() || this.conditionCoverageLoading()) return;

        const dataSetId = this.dataSetIdSig();
        const rule = this.ruleSig() || {};
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
          conclusion: {
            value: (editorConclusionState as ConclusionEditorSurviavalObject)?.value || 0,
            median_survival_time_ci_lower:
              (editorConclusionState as ConclusionEditorSurviavalObject)?.median_survival_time_ci_lower || 0,
            median_survival_time_ci_upper:
              (editorConclusionState as ConclusionEditorSurviavalObject)?.median_survival_time_ci_upper || 0,
            fixed: (editorConclusionState as ConclusionEditorSurviavalObject)?.fixed || false,
          },
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
        if (this.isDxListEmptySignal()) return;
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

        const hasValueChanged = (): boolean => {
          const hasNoExamplesCoveredError = this.hasNoExamplesCoveredError();
          const iseditorConclusionStateNull = editorConclusionState === null || editorConclusionState === undefined;

          //TODO : check if this is correct
          const didDxListValueObjectChange = listValueObject?.didChange ?? false;

          return (didDxListValueObjectChange) || iseditorConclusionStateNull;
        };

        const updateConditions = (): any[] => {
          return (
            conditions?.subconditions?.map((condition: any) => {
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
          return this.projectService.getConditionsCoverage(dataSetId, {
            meta: {
              attributes: attributeNames ?? [],
            },
            conditions: [updatedConditions],
          });
        };

        const request = prepareRequest();
        this.conditionCoverageLoading.set(true);
        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (response: any | null) => {
            if (listValueObject) {
              this.listValueObjectSignal.update(() => {
                return { value: listValueObject.value, didChange: false }
              })
            }

            this.editorConclusionState.set(response);
            this.lastSuccesfullEditorConclusionState.set(response);

            this.hasNoExamplesCoveredError.set(response === null);
            this.coverage.set(response);
            this.displayedMetrics();

            const configIsEdit = true;
            this.conditionCoverageLoading.set(false);

            if (!response || this.originalRuleCoverageSig() || !configIsEdit) return;
            this.setOriginalRuleCoverageSig(response[0]);
          },
          error: (httpError: HttpErrorResponse) => {
            const errorMsgId = (httpError.error as ErrorResponse)?.err_msg_id;
            if (errorMsgId !== this.NO_EXAMPLES_COVERED_ERROR) {
              this.editorConclusionState.set(lastSuccesfullConclusionEditrorSelected);
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
}
