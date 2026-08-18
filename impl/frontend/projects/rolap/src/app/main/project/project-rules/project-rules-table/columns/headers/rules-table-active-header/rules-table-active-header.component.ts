import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { filterOutNullish } from '../../../../../../../common/utils/rxjsUtils';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { ValueChangedEvent } from 'devextreme/ui/check_box';

import { AppState, RefreshAllState } from '../../../../../../../common/store/app-state.model';
import { selectRefreshAll } from '../../../../../../../common/store/ruleSets/rulesets.reducer';
import { V2RulesTableActions } from '../../../../../../../common/store/v2RulesTable/v2RulesTable.action';
import { selectCurrentV2RulesTableActiveHeaderCheckboxValue } from '../../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { isNotCausedByUserEvent } from '../../../../../../../common/utils/devExtremeEventsUtils';
import { ProblemTypes } from '../../../../../../data-upload/utils/enums';
import { DataField } from '../../../../../service/models/rules-customize-columns-api';
import { DisplayType } from '../../../models/rules-table';

@Component({
  selector: 'rolap-rules-table-active-header',
  templateUrl: './rules-table-active-header.component.html',
  styleUrls: ['./rules-table-active-header.component.scss'],
})
export class RulesTableActiveHeaderComponent implements OnInit, OnDestroy {
  @Input() set problemType(value: ProblemTypes) {
    this.problemType$.next(value);
  }

  @Input() set displayType(value: DisplayType) {
    this.displayType$.next(value);
  }

  public isChecked: boolean = false;
  public isDisabled: boolean = false;
  public dataField: DataField.Active = DataField.Active;

  private problemType$ = new BehaviorSubject<ProblemTypes | null>(null);
  private displayType$ = new BehaviorSubject<DisplayType | null>(null);
  private ngUnsubscribe = new Subject<void>();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    const problemTypeAndDisplayType$ = combineLatest([
      this.problemType$.pipe(filter((val): val is ProblemTypes => val !== null)),
      this.displayType$.pipe(filter((val): val is DisplayType => val !== null)),
    ]);

    const isChecked$ = this.store
      .select(selectCurrentV2RulesTableActiveHeaderCheckboxValue)
      .pipe(filterOutNullish(), distinctUntilChanged());

    const refreshAllState$ = this.store.select(selectRefreshAll).pipe(distinctUntilChanged());

    combineLatest([problemTypeAndDisplayType$, isChecked$, refreshAllState$])
      .pipe(takeUntil(this.ngUnsubscribe))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .subscribe(([_, isChecked, refreshAllState]) => {
        this.isChecked = isChecked;
        this.isDisabled = refreshAllState === RefreshAllState.PROCESSING_DATA;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onCheckBoxValueChanged(e: ValueChangedEvent): void {
    if (isNotCausedByUserEvent(e)) return;
    this.store.dispatch(V2RulesTableActions.currentTableActivesHeaderToggle({ activeValue: e.value }));
  }
}
