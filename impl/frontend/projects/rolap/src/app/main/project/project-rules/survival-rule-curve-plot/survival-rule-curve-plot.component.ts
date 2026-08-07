import { CommonModule } from '@angular/common';
import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { of, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { selectCurrentAttributes } from '../../../../common/store/attributes/attributes.selectors';
import { V2RulesTable } from '../../../../common/store/v2RulesTable/types';
import { selectCurrentV2RulesTable } from '../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { convertRulesBigTableForBackend } from '../../../data-upload/utils/utils';
import { DatasetAttribute } from '../../dataset/models/dataset';
import { NewRow, RuleCoverage, SurvivalMeta } from '../../models/ruleset';
import { RefreshService } from '../../service/refresh.service';
import { KaplanMeierEstimator } from '../project-rules-table/columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';
import { SurvivalCurvePlotComponent } from '../survival-curve-plot/survival-curve-plot.component';

@Component({
  selector: 'rolap-survival-rule-curve-plot',
  standalone: true,
  imports: [CommonModule, SurvivalCurvePlotComponent, TranslateModule],
  templateUrl: './survival-rule-curve-plot.component.html',
  styleUrls: ['./survival-rule-curve-plot.component.scss'],
})
export class SurvivalRuleCurvePlotComponent {
  @Input({ required: true }) selectedRowsUuids!: Set<string>;

  private readonly translate = inject(TranslateService);
  private readonly store = inject(Store<AppState>);
  private readonly refreshService = inject(RefreshService);

  private readonly rulesUuidsToRulesStrings = signal<Map<string, string>>(new Map());
  private readonly attributeNames = signal<string[]>([]);
  private readonly defaultKaplanMeier = signal<KaplanMeierEstimator | null>(null);

  private readonly idsSignal = toSignal(this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish()), {
    requireSync: true,
  });
  private readonly v2RulesTableSignal = toSignal(
    this.store.select(selectCurrentV2RulesTable).pipe(filterOutNullish()),
    { requireSync: true },
  );
  private readonly coverage$ = toSignal(
    this.store.select(selectCurrentV2RulesTable).pipe(
      filterOutNullish(),
      switchMap((v2RulesTable) =>
        this.idsSignal()
          ? this.refreshService.getGlobalRulesCoverage(this.idsSignal()!, {
              meta: v2RulesTable.meta as SurvivalMeta,
              rules: convertRulesBigTableForBackend(v2RulesTable.data),
            })
          : of(null),
      ),
    ),
  );
  private readonly attributes$ = toSignal(this.store.select(selectCurrentAttributes).pipe(filterOutNullish()));

  public readonly estimators = computed(() => {
    const [coverage, attributes, updatedData] = this.processData();
    return coverage ? this.createEstimatorsMap(coverage, attributes, updatedData) : new Map();
  });

  private readonly initializeDataEffect = effect(
    () => {
      const v2RulesTable = this.v2RulesTableSignal();
      if (this.idsSignal() && v2RulesTable) {
        const meta = v2RulesTable.meta as SurvivalMeta;
        this.defaultKaplanMeier.set(meta.default_conclusion);
        this.populateRulesUuidsToStrings(v2RulesTable);
        this.attributeNames.set(this.attributes$()?.map((item) => item.name) || []);
      }
    },
    { allowSignalWrites: true },
  );

  private processData(): [RuleCoverage | null, DatasetAttribute[], any[]] {
    const coverage = this.coverage$();
    const attributes = this.attributes$();
    if (!coverage || !attributes) return [null, [], []];

    const updatedData = this.v2RulesTableSignal()
      .data.filter((item) => this.selectedRowsUuids.has(item.uuid))
      .map(this.updateAttributesForItem.bind(this));

    return [coverage, attributes, updatedData];
  }

  private populateRulesUuidsToStrings(v2RulesTable: V2RulesTable): void {
    this.rulesUuidsToRulesStrings.set(
      new Map(
        v2RulesTable.data
          .filter((row) => this.selectedRowsUuids.has(row.uuid))
          .map((row: NewRow) => [row.uuid, `r${row.autoIncrement}: ${row.displayString}`]),
      ),
    );
  }

  private updateAttributesForItem(item: NewRow): any {
    const updatedConditions = item.premise.subconditions.map((condition: any) => {
      if (condition.attributes && typeof condition.attributes[0] === 'string') {
        const attributeIndex = this.attributeNames().indexOf(condition.attributes[0]);
        return { ...condition, attributes: [attributeIndex] };
      }
      return condition;
    });
    return {
      ...item,
      premise: { ...item.premise, subconditions: updatedConditions },
      autoIncrement: item.autoIncrement,
    };
  }

  private createEstimatorsMap(
    coverage: RuleCoverage,
    attributes: DatasetAttribute[],
    updatedData: any[],
  ): Map<string, KaplanMeierEstimator> {
    const estimators = new Map<string, KaplanMeierEstimator>();

    this.selectedRowsUuids.forEach((ruleUuid) => {
      const ruleString = this.rulesUuidsToRulesStrings().get(ruleUuid);
      if (ruleString && coverage[ruleUuid]?.kaplan_meier_estimator) {
        estimators.set(ruleString, coverage[ruleUuid].kaplan_meier_estimator!);
      }
    });

    const defaultEstimator = this.defaultKaplanMeier();
    if (defaultEstimator) {
      estimators.set(
        this.translate.instant('project.rules.rule_survival_curve_plot.default_estimator'),
        defaultEstimator,
      );
    }

    attributes.forEach((item: any, index) => {
      const rule = updatedData[index];
      if (rule && item?.kaplan_meier_estimator?.times && item?.kaplan_meier_estimator?.probabilities) {
        const key = this.translate.instant('project.rules.rule_survival_curve_plot.not_rule', {
          ruleNumber: rule.autoIncrement,
        });
        estimators.set(key, {
          times: item.kaplan_meier_estimator.times,
          probabilities: item.kaplan_meier_estimator.probabilities,
        });
      }
    });

    return estimators;
  }
}
