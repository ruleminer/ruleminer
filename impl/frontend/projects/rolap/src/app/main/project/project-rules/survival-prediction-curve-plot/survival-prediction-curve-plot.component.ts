import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { selectCurrentV2RulesTableMeta } from '../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { SurvivalMeta, SurvivalPredictionItem } from '../../models/ruleset';
import { KaplanMeierEstimator } from '../project-rules-table/columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';
import { SurvivalCurvePlotComponent } from '../survival-curve-plot/survival-curve-plot.component';

@Component({
  selector: 'rolap-survival-prediction-curve-plot',
  standalone: true,
  imports: [CommonModule, TranslateModule, SurvivalCurvePlotComponent],
  templateUrl: './survival-prediction-curve-plot.component.html',
  styleUrls: ['./survival-prediction-curve-plot.component.scss'],
})
export class SurvivalPredictionCurvePlotComponent implements OnDestroy {
  @Input() set prediction(estimator: SurvivalPredictionItem) {
    this.predictionEstimator = estimator;
    this.setData();
  }
  public estimators: Map<string, KaplanMeierEstimator> = new Map();
  private defaultEstimator: KaplanMeierEstimator;
  private predictionEstimator: SurvivalPredictionItem;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>, private translate: TranslateService) {
    this.store
      .select(selectCurrentV2RulesTableMeta)
      .pipe(filterOutNullish(), takeUntil(this.ngUnsubscribe))
      .subscribe((tableMeta) => {
        const meta = tableMeta as SurvivalMeta;
        this.defaultEstimator = meta.default_conclusion;
        this.setData();
      });

    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      // reload table on language change to refresh estimators names translations
      this.setData();
    });
  }

  private setData() {
    const estimators: Map<string, KaplanMeierEstimator> = new Map();
    if (this.predictionEstimator) {
      estimators.set('project.rules_coverage.prediction', this.predictionEstimator);
    }
    if (this.defaultEstimator) {
      estimators.set('project.rules.rule_survival_curve_plot.default_estimator', this.defaultEstimator);
    }
    this.estimators = estimators;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
