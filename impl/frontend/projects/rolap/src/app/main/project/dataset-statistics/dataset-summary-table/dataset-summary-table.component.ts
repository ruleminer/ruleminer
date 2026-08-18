import { Component, Input, inject } from '@angular/core';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { Observable, combineLatest, map, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { isEmpty } from 'lodash';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import {
  getDecisionAttribute,
  getTypeOfProblem,
} from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import { selectCurrentV2StatisticsTabUnimportantAttributes } from 'projects/rolap/src/app/common/store/v2StatisticsTab/v2StatisticsTab.selectors';

import { ProblemTypes } from '../../../data-upload/utils/enums';
import { SummaryInfo } from '../../../data-upload/utils/types';
import { DecisionAttributesSummary, UnimportantAttributes } from '../../dataset/models/dataset-statistics';

@Component({
  selector: 'rolap-dataset-summary-table',
  templateUrl: './dataset-summary-table.component.html',
  styleUrls: ['./dataset-summary-table.component.scss'],
})
export class DatasetSummaryTableComponent {
  @Input() dataSource: Observable<SummaryInfo>;
  private store = inject(Store<AppState>);

  public combinedSummary$: Observable<{
    decisionAttributes: DecisionAttributesSummary;
    unimportantAttributes: UnimportantAttributes | undefined;
  }> = combineLatest([
    this.store.select(getDecisionAttribute).pipe(
      filterOutNullish(),
      switchMap((decisionAttributes) =>
        this.store.select(getTypeOfProblem).pipe(
          filterOutNullish(),
          map((problemType: ProblemTypes) => ({
            isSurvival: problemType === ProblemTypes.Survival,
            ...decisionAttributes,
          })),
        ),
      ),
    ),
    this.store.select(selectCurrentV2StatisticsTabUnimportantAttributes),
  ]).pipe(
    map(([decisionAttributes, unimportantAttributes]) => ({
      decisionAttributes,
      unimportantAttributes: isEmpty(unimportantAttributes) ? undefined : unimportantAttributes,
    })),
  );
}
