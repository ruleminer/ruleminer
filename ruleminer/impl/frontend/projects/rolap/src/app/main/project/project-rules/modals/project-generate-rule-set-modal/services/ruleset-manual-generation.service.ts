import { Injectable, inject } from '@angular/core';

import { Observable, map, of, switchMap } from 'rxjs';

import { Label } from '../../../../../../common/components/label/interfaces/label.model';
import { RuleSetApiService } from '../../../../../../common/services/rule-set/rule-set-api.service';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { DatasetAttributesRoles } from '../../../../dataset/models/dataset';
import { DatasetStatisticsColumn } from '../../../../dataset/models/dataset-statistics';
import { DatasetService } from '../../../../dataset/service/dataset.service';
import { CreateRulesetRequest, ProcessCreatedResponse } from '../../../../models/ruleset';
import { ProjectService } from '../../../../service/project.service';
import { KaplanMeierEstimator } from '../../../project-rules-table/columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';
import { RulesetManualGenerateData } from './types';

@Injectable({
  providedIn: 'root',
})
export class RulesetManualGenerationService {
  private ruleSetService = inject(RuleSetApiService);
  private projectService = inject(ProjectService);
  private datasetService = inject(DatasetService);

  public generateRuleSetManually(data: RulesetManualGenerateData): Observable<ProcessCreatedResponse> {
    if (data.manuallySelectedIds) {
      return this.generateRulesetFromAnotherRuleset(data);
    } else {
      return this.generateRulesetFromSelectedRules(data);
    }
  }

  private generateRulesetFromAnotherRuleset(data: RulesetManualGenerateData): Observable<ProcessCreatedResponse> {
    const { dataSetId, ruleSetId } = data.manuallySelectedIds;
    return this.projectService.getRuleSet(dataSetId, ruleSetId).pipe(
      switchMap((ruleset) => {
        const labels = this.createRuleSetLabelsObject(data.selectedManuallyRules);
        const cleanedRules = this.cleanStatisticalProperties(data.selectedManuallyRules);
        const body: CreateRulesetRequest = {
          name: data.rulesetName,
          description: '',
          ruleset: { ...ruleset, rules: cleanedRules },
          rules_labels: labels,
          attached_to_dataset_id: data.ids.dataSetId!,
          prediction_config: data.predictionConfig,
        };

        return this.ruleSetService.createRuleSet(body);
      }),
    );
  }

  private generateRulesetFromSelectedRules(data: RulesetManualGenerateData): Observable<ProcessCreatedResponse> {
    const labels: Record<string, number[]> = {};
    data.selectedManuallyRules.forEach((rule) => {
      labels[rule.uuid] = rule.labels ? rule.labels.map((x: Label) => x.id) : [];
    });
    const baseRequest: Partial<CreateRulesetRequest> = {
      name: data.rulesetName,
      description: '',
      rules_labels: labels,
      attached_to_dataset_id: data.ids.dataSetId!,
      prediction_config: data.predictionConfig,
    };

    const cleanedRules = this.cleanStatisticalProperties(data.selectedManuallyRules);

    let request$: Observable<Partial<CreateRulesetRequest>>;
    switch (data.problemType) {
      case ProblemTypes.Classification:
        request$ = this.prepareRequestForClassification(baseRequest, data, cleanedRules);
        break;
      case ProblemTypes.Regression:
        request$ = this.prepareRequestForRegression(baseRequest, data, cleanedRules);
        break;
      case ProblemTypes.Survival:
        request$ = this.prepareRequestForSurvival(baseRequest, data, cleanedRules);
        break;
      default:
        throw new Error('Unsupported problem type:', data.problemType);
    }
    return request$.pipe(switchMap((body) => this.ruleSetService.createRuleSet(body as CreateRulesetRequest)));
  }

  private cleanStatisticalProperties(rules: any[]): any[] {
    if (!rules) {
      return [];
    }
    return rules.map((rule) => {
      const newRule = { ...rule };

      const fieldsToRemove = [
        'support',
        'precision',
        'correlation',
        'p',
        'n',
        'pUpperCase',
        'nUpperCase',
        'coverage',
        'c2',
        'rss',
        'lift',
        'pValue',
        'sensitivity',
        'specificity',
        'negativePredictiveValue',
        'oddsRatio',
        'relativeRisk',
        'lrPlus',
        'lrMinus',
        'conditionsCount',
        'active',
        'censoredCount',
        'coveredCount',
        'eventsCount',
        'medianSurvivalTime',
        'medianSurvivalTimeCiLower',
        'medianSurvivalTimeCiUpper',
        'logRankStats',
        'kaplanMeierEstimator',
      ];

      fieldsToRemove.forEach((field) => delete newRule[field]);

      return newRule;
    });
  }

  private prepareRequestForClassification(
    baseRequest: Partial<CreateRulesetRequest>,
    data: RulesetManualGenerateData,
    cleanedRules: any[],
  ): Observable<Partial<CreateRulesetRequest>> {
    return of({
      ...baseRequest,
      ruleset: {
        meta: {
          attributes: data.datasetInfo.attributes,
          decision_attribute: data.decisionAttributeName,
          decision_attribute_distribution: data.datasetInfo.classDistribution,
        },
        rules: cleanedRules,
      },
    });
  }

  private prepareRequestForRegression(
    baseRequest: Partial<CreateRulesetRequest>,
    data: RulesetManualGenerateData,
    cleanedRules: any[],
  ): Observable<Partial<CreateRulesetRequest>> {
    return this.datasetService.getDatasetStatistic(data.ids.dataSetId!).pipe(
      map((statistics) => {
        const classColumn = statistics.columns.find((item: DatasetStatisticsColumn) => item.column_role === 'class');
        const meanStat: string | undefined = classColumn?.statistics.find((stat) => stat.name === 'mean')?.value;
        if (meanStat === undefined) throw new Error('Mean value not found in dataset attributes statistics');
        const meanValue: number = Number.parseFloat(meanStat);

        return {
          ...baseRequest,
          ruleset: {
            meta: {
              attributes: data.datasetInfo.attributes,
              decision_attribute: data.decisionAttributeName,
              y_train_median: meanValue,
            },
            rules: cleanedRules,
          },
        };
      }),
    );
  }

  private prepareRequestForSurvival(
    baseRequest: Partial<CreateRulesetRequest>,
    data: RulesetManualGenerateData,
    cleanedRules: any[],
  ): Observable<Partial<CreateRulesetRequest>> {
    const survivalAttrName = data.datasetInfo.datasetAttributes.find(
      (attr) => attr.role === DatasetAttributesRoles.SURVIVAL_TIME,
    )?.name;

    return this.projectService
      .getDefaultKaplanaMeierEstimator(data.ids.dataSetId!, {
        conditions: [[]],
        meta: { attributes: data.datasetInfo.attributes },
      })
      .pipe(
        map((kaplanMeier: KaplanMeierEstimator) => ({
          ...baseRequest,
          ruleset: {
            meta: {
              attributes: (() => {
                if (!survivalAttrName) return data.datasetInfo.attributes;
                return data.datasetInfo.attributes.includes(survivalAttrName)
                  ? data.datasetInfo.attributes
                  : [...data.datasetInfo.attributes, survivalAttrName];
              })(),
              decision_attribute: data.decisionAttributeName,
              default_conclusion: kaplanMeier,
              survival_time_attribute: survivalAttrName,
            },
            rules: cleanedRules,
          },
        })),
      );
  }

  private createRuleSetLabelsObject(selectedRules: any[]) {
    const obj: Record<string, number[]> = {};

    for (let i = 0; i < selectedRules.length; i++) {
      obj[selectedRules[i].uuid] = selectedRules[i].labels ? selectedRules[i].labels.map((x: Label) => x.id) : [];
    }

    return obj;
  }
}
