import { Component, Signal, WritableSignal, computed, effect, inject, signal } from '@angular/core';

import { cloneDeep } from 'lodash';

import { KaplanMeierEstimator } from '../../../../columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';
import { EDITOR_STATE_SERVICE_TOKEN } from '../../../service/editor-state/editor-state.provider';
import { BaseConclusion } from '../rule-conclusion-editor.component';

export interface SurvivalConclusionValue extends BaseConclusion {
  value: number | string;
  median_survival_time_ci_lower: number | string;
  median_survival_time_ci_upper: number | string;
  fixed: boolean;
}

type PlotEstimators = Map<string, { times: number[]; probabilities: number[] }>;

@Component({
  selector: 'rolap-survival-rule-conclusion-editor',
  templateUrl: './survival-rule-conclusion-editor.component.html',
  styleUrls: ['./survival-rule-conclusion-editor.component.scss'],
})
export class SurvivalRuleConclusionEditorComponent {
  public readonly DISPLAY_NUMBER_FORMAT: string = '1.1-3';

  private editorStateService = inject(EDITOR_STATE_SERVICE_TOKEN);
  private conclusionSignal = this.editorStateService.rawRuleMetrics;

  public conclusionMap = computed(() => {
    const conclusion = this.conclusionSignal();
    if (!conclusion) return null;
    return conclusion.reduce((acc: any, item: any) => {
      acc[item.name] = item.value;
      return acc;
    }, {});
  });

  private editedRule: Signal<{ times: number[]; probabilities: number[] } | null> = computed(() => {
    const values: any = this.editorStateService.editorConclusionState();
    if (!values) return null;
    const valueObject = values[0];
    if (valueObject && typeof valueObject === 'object' && (valueObject as any)['kaplan_meier_estimator']) {
      const estimator = (valueObject as any)['kaplan_meier_estimator'] as KaplanMeierEstimator;
      return {
        times: estimator.times,
        probabilities: estimator.probabilities,
      };
    }
    return null;
  });

  public finalEstimators: PlotEstimators | null = null;

  private originalRule: WritableSignal<{ times: number[]; probabilities: number[] } | null> = signal<{
    times: number[];
    probabilities: number[];
  } | null>(null);
  private isEditedRuleLoaded = signal<boolean>(false);

  constructor() {
    effect(
      () => {
        if (this.editedRule() !== null) {
          this.isEditedRuleLoaded.set(true);
        } else {
          this.isEditedRuleLoaded.set(false);
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const editedRuleValue = this.editedRule();
        if (editedRuleValue && this.originalRule() === null && this.isEditedRuleLoaded()) {
          this.originalRule.set(cloneDeep(editedRuleValue));
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        if (!this.isEditedRuleLoaded()) return;
        const plotEstimators: PlotEstimators = new Map();
        const editedRule = this.editedRule();
        const originalRule = this.originalRule();

        if (!editedRule || !originalRule) return;

        plotEstimators.set('project.rules.rule_editor.survival_conclusion.edited_rule_label', cloneDeep(editedRule));
        plotEstimators.set(
          'project.rules.rule_editor.survival_conclusion.original_rule_label',
          cloneDeep(originalRule),
        );

        this.finalEstimators = plotEstimators;
      },
      { allowSignalWrites: true },
    );
  }
}
