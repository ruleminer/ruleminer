import { Component, OnDestroy } from '@angular/core';

import { Subject, distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil } from 'rxjs';

import { Store, select } from '@ngrx/store';
import { isEqual } from 'lodash';

import { AppState } from '../../../../common/store/app-state.model';
import {
  getCurentTabDescriptionAlgoName,
  getCurentTabDescriptionAttributes,
} from '../../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';

@Component({
  selector: 'rolap-ruleset-generation-parameters',
  templateUrl: './ruleset-generation-parameters.component.html',
  styleUrls: ['./ruleset-generation-parameters.component.scss'],
})
export class RulesetGenerationParametersComponent implements OnDestroy {
  private ngUnsubscribe = new Subject<void>();
  private ids$ = this.store.pipe(select(selectCurrentV2TabIds)).pipe(
    distinctUntilChanged(isEqual),
    filter((ids) => !!ids?.dataSetId),
    shareReplay(1),
    takeUntil(this.ngUnsubscribe),
  );

  constructor(private store: Store<AppState>) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public algorithmParams$ = this.ids$.pipe(
    switchMap(() => {
      return this.store
        .pipe(select(getCurentTabDescriptionAttributes))
        .pipe(map((data) => data?.generation_params?.algorithm_params || {}));
    }),
    takeUntil(this.ngUnsubscribe),
  );

  public algoName$ = this.ids$.pipe(
    switchMap(() => this.store.pipe(select(getCurentTabDescriptionAlgoName))),
    takeUntil(this.ngUnsubscribe),
  );
}
