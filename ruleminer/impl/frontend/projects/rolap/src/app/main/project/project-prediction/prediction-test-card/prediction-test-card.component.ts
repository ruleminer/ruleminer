import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs';

import { Store, select } from '@ngrx/store';
import { isEqual } from 'lodash';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { loadPredictionIndicatorsTestData } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.action';
import { getCurrentTestCard } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';

import { activeProjectSelector } from '../../../../common/store/project/project.selectors';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { ProblemTypes } from '../../../data-upload/utils/enums';

@Component({
  selector: 'rolap-prediction-test-card',
  templateUrl: './prediction-test-card.component.html',
  styleUrls: ['./prediction-test-card.component.scss'],
})
export class PredictionTestCardComponent implements OnInit, OnDestroy {
  public problemType: ProblemTypes;
  public specificDecisionClass: string;
  public predictionPercentage: number;
  private ngUnsubscribe = new Subject<void>();
  public isCalculating = false;

  public ids$ = this.store.pipe(select(selectCurrentV2TabIds)).pipe(
    distinctUntilChanged(isEqual),
    filter((ids) => !!ids?.dataSetId),
    takeUntil(this.ngUnsubscribe),
  );

  public testCard$ = this.store.pipe(
    select(getCurrentTestCard),
    filter((testCard) => !!testCard),
    distinctUntilChanged(isEqual),
    map((testCard) => {
      if (!testCard?.data?.general) {
        return testCard;
      }

      const updatedTestCard = {
        ...testCard,
        data: {
          ...testCard.data,
          general: {
            ...testCard.data.general,
          },
        },
      };

      delete updatedTestCard.data.general.Covered_by_prediction;
      delete updatedTestCard.data.general.Not_covered_by_prediction;

      return updatedTestCard;
    }),
    takeUntil(this.ngUnsubscribe),
  );

  public refresh$ = this.testCard$.pipe(
    map((testCard) => testCard?.refresh || false),
    takeUntil(this.ngUnsubscribe),
  );

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
    this.store
      .select(activeProjectSelector)
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe((activeProject) => {
        this.problemType = activeProject.type_of_problem;
      });

    this.setSpecificDecisionClass();

    this.store
      .pipe(
        select(getCurrentTestCard),
        filter((testCard) => !!testCard),
        distinctUntilChanged(isEqual),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((testCard) => {
        if (!testCard || !testCard.data || !testCard.data.general) return;

        const { Covered_by_prediction, Not_covered_by_prediction } = testCard.data.general;

        if (Covered_by_prediction !== undefined && Not_covered_by_prediction !== undefined) {
          this.predictionPercentage =
            (Covered_by_prediction / (Covered_by_prediction + Not_covered_by_prediction)) * 100;
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public refreshClick(): void {
    this.ids$.pipe(take(1), takeUntil(this.ngUnsubscribe)).subscribe((ids) => {
      this.store.dispatch(loadPredictionIndicatorsTestData({ ids, data: null }));
    });
  }

  private setSpecificDecisionClass(): void {
    switch (this.problemType) {
      case ProblemTypes.Survival:
        this.specificDecisionClass = `tooltips.rules_table.specific_decision_class_${ProblemTypes.Survival}`;
        break;
      case ProblemTypes.Regression:
        this.specificDecisionClass = `tooltips.rules_table.specific_decision_class_${ProblemTypes.Regression}`;
        break;
      default:
        this.specificDecisionClass = `tooltips.rules_table.specific_decision_class_${ProblemTypes.Classification}`;
        break;
    }
  }

  public setCalculating(calculating: boolean) {
    this.isCalculating = calculating;
  }
}
