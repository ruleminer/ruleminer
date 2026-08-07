import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { filterOutNullish } from '../../../../../utils/rxjsUtils';
import { ReplaySubject, Subject, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { KaplanMeierEstimator } from 'projects/rolap/src/app/main/project/project-rules/project-rules-table/columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';
import { SurvivalCurvePlotComponent } from 'projects/rolap/src/app/main/project/project-rules/survival-curve-plot/survival-curve-plot.component';

import { SurvivalMeta } from '../../../../../../main/project/models/ruleset';
import { selectCurrentV2RulesTableMeta } from '../../../../../store/v2RulesTable/v2RulesTable.selectors';

@Component({
  selector: 'rolap-survival-conditions-coverage-plot',
  standalone: true,
  imports: [CommonModule, TranslateModule, SurvivalCurvePlotComponent],
  templateUrl: './survival-conditions-coverage-plot.component.html',
  styleUrls: ['./survival-conditions-coverage-plot.component.scss'],
})
export class SurvivalConditionsCoveragePlotComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: { kaplan_meier_estimator: KaplanMeierEstimator };
  public estimators: Map<string, { times: number[]; probabilities: number[] }>;
  private defaultKaplanMeier: ReplaySubject<KaplanMeierEstimator> = new ReplaySubject(1);
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>, private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      if (!this.data) return;
      this.prepareEstimators();
    }
  }

  ngOnInit(): void {
    this.store
      .select(selectCurrentV2RulesTableMeta)
      .pipe(
        filterOutNullish(),
        take(1), // default conclusion won't change event if ruleset change
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((meta) => {
        const survivalMeta = meta as SurvivalMeta;
        this.defaultKaplanMeier.next(survivalMeta.default_conclusion);
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private prepareEstimators() {
    this.defaultKaplanMeier.pipe(take(1)).subscribe((defaultEstimator: KaplanMeierEstimator) => {
      const estimators: Map<string, { times: number[]; probabilities: number[] }> = new Map();
      estimators.set('project.rules.rule_survival_curve_plot.default_estimator', defaultEstimator);
      estimators.set('project.rules.rule_survival_curve_plot.selected_conditions', this.data.kaplan_meier_estimator);
      this.estimators = estimators;
    });
  }
}
