import { Component, OnDestroy, OnInit } from '@angular/core';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { Subject, lastValueFrom, map, take, takeUntil } from 'rxjs';

import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { NotifyService } from '../../../common/services/notify/notify.service';
import { AppState, RuleSetTab } from '../../../common/store/app-state.model';
import { getCurentTab } from '../../../common/store/ruleSets/rulesets.reducer';
import { V2PredictionQualityTab } from '../../../common/store/v2PredictionQualityTab/types';
import {
  isLoadingCurrentV2PredictionQualityTab,
  selectCurrentV2PredictionQualityTabCrossValidation,
  selectCurrentV2PredictionQualityTabGeneralIndicators,
  selectCurrentV2PredictionQualityTabHistogram,
} from '../../../common/store/v2PredictionQualityTab/v2PredictionTabQuality.selectors';
import {
  selectCurrentV2RulesTableData,
  selectCurrentV2RulesTableIsNumberOfFilteredRowZero,
} from '../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2Tab, selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { ProblemTypes } from '../../data-upload/utils/enums';
import { RefreshService } from '../service/refresh.service';

@Component({
  selector: 'rolap-project-prediction',
  templateUrl: './project-prediction.component.html',
  styleUrls: ['./project-prediction.component.scss'],
})
export class ProjectPredictionComponent implements OnInit, OnDestroy {
  public dataSetName$ = this.store.pipe(
    select(selectCurrentV2Tab),
    map((v2Tab) => {
      if (!v2Tab) return '';
      return v2Tab && v2Tab.datasetText ? v2Tab.datasetText : v2Tab.text;
    }),
  );
  public tab: RuleSetTab;
  public isRefreshing = false;
  public crossValidation: V2PredictionQualityTab['crossValidation'];
  public currentHistogramData: V2PredictionQualityTab['histogram'] | null;
  public problemType: ProblemTypes;
  public generalIndicators: any;
  public isLoading$ = this.store.select(isLoadingCurrentV2PredictionQualityTab);
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private refreshService: RefreshService,
    private store: Store<AppState>,
    private notifyService: NotifyService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    this.getPredictionIndicatorHistogram();
    this.setProjectType();
    this.getPredictionIndicatorCrossValidation();
    this.setUpPredictionIndicators();
    this.store
      .select(getCurentTab())
      .pipe(takeUntil(this.ngUnsubscribe), filterOutNullish())
      .subscribe((tab) => {
        this.tab = tab as RuleSetTab;
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public async refreshClick(): Promise<void> {
    this.isRefreshing = true;
    try {
      const isNumberOfFilteredRowsZero = await lastValueFrom(
        this.store.select(selectCurrentV2RulesTableIsNumberOfFilteredRowZero).pipe(take(1)),
      );
      if (isNumberOfFilteredRowsZero) {
        this.notifyService.showNotify(
          this.translateService.instant('project.rules.table_info.table_is_empty'),
          'warning',
          true,
        );
        return;
      }

      const ids = await lastValueFrom(this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish(), take(1)));
      const table = await lastValueFrom(
        this.store.select(selectCurrentV2RulesTableData).pipe(filterOutNullish(), take(1)),
      );
      if (!ids || !table) return;
      await this.refreshService.refreshPredictionTrainingData(table, null, ids);
    } finally {
      this.isRefreshing = false;
    }
  }

  private getPredictionIndicatorHistogram(): void {
    this.store
      .select(selectCurrentV2PredictionQualityTabHistogram)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((histogram) => {
        if (!histogram) return;
        this.currentHistogramData = Object.keys(histogram).length === 0 ? null : histogram;
      });
  }

  private getPredictionIndicatorCrossValidation(): void {
    this.store
      .select(selectCurrentV2PredictionQualityTabCrossValidation)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((crossValidation) => {
        if (!crossValidation) return;
        this.crossValidation = crossValidation;
      });
  }

  private setProjectType(): void {
    this.store
      .select((state) => state.project.activeProject)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((project) => {
        this.problemType = project.type_of_problem;
      });
  }

  private setUpPredictionIndicators(): void {
    this.store
      .select(selectCurrentV2PredictionQualityTabGeneralIndicators)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((generalIndicators: any) => {
        if (!generalIndicators) return;
        this.generalIndicators = generalIndicators.general;
      });
  }
}
