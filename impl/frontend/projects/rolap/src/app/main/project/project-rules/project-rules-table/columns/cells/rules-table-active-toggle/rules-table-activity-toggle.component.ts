import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { filterOutNullish } from '../../../../../../../common/utils/rxjsUtils';
import { BehaviorSubject, Subject, combineLatest, distinctUntilChanged, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { ValueChangedEvent } from 'devextreme/ui/check_box';
import { AppState, RefreshAllState } from 'projects/rolap/src/app/common/store/app-state.model';

import { selectRefreshAll } from '../../../../../../../common/store/ruleSets/rulesets.reducer';
import { V2RulesTableActions } from '../../../../../../../common/store/v2RulesTable/v2RulesTable.action';
import { selectCurrentV2RulesTableActiveUuids } from '../../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { isNotCausedByUserEvent } from '../../../../../../../common/utils/devExtremeEventsUtils';

@Component({
  selector: 'rolap-rules-table-activity-toggle',
  templateUrl: './rules-table-activity-toggle.component.html',
  styleUrls: ['./rules-table-activity-toggle.component.scss'],
})
export class RulesTableActivityToggleComponent implements OnInit, OnDestroy {
  @Input() set uuid(value: string) {
    this.uuid$.next(value);
  }

  public isChecked: boolean;
  public isDisabled: boolean;

  private ngUnsubscribe = new Subject<void>();
  private uuid$ = new BehaviorSubject<string>('');

  public refreshAllState$ = this.store.select(selectRefreshAll).pipe(distinctUntilChanged());

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    combineLatest([
      this.uuid$,
      this.store.select(selectCurrentV2RulesTableActiveUuids).pipe(filterOutNullish()),
      this.refreshAllState$,
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(([uuid, activeRowsUuids, refreshAllState]) => {
        this.setIsCheckedAndDisabled(activeRowsUuids, uuid, refreshAllState);
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.uuid$.complete();
  }

  public onCheckBoxValueChanged(e: ValueChangedEvent): void {
    if (isNotCausedByUserEvent(e)) return;
    this.store.dispatch(V2RulesTableActions.updateCurrentTableRowActiveState({ rowUuid: this.uuid$.value }));
  }

  private setIsCheckedAndDisabled(activeRowsUuids: string[], uuid: string, refreshAllState: string): void {
    this.isChecked = activeRowsUuids.includes(uuid);

    if (refreshAllState === RefreshAllState.PROCESSING_DATA) {
      this.isDisabled = true;
    } else {
      const canDeleteOrDeactivateRules = activeRowsUuids.length > 1;
      this.isDisabled = !canDeleteOrDeactivateRules && this.isChecked;
    }
  }
}
