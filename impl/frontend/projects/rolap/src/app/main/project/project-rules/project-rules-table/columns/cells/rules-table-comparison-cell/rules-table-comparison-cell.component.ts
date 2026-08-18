import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { filterOutNullish } from '../../../../../../../common/utils/rxjsUtils';
import { Observable, Subject, combineLatest, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { ValueChangedEvent } from 'devextreme/ui/check_box';

import { AppState, RuleTableUse, SubTabsNames } from '../../../../../../../common/store/app-state.model';
import { V2ComparisonActions } from '../../../../../../../common/store/v2Comparison/v2Comparison.action';
import {
  selectComparisonSelectedRowsUUIDs,
  selectCurrentV2ComparisonFormRelationType,
} from '../../../../../../../common/store/v2Comparison/v2Comparison.selectors';
import { V2RulesTableActions } from '../../../../../../../common/store/v2RulesTable/v2RulesTable.action';
import { selectCurrentV2RulesTableCompareUuids } from '../../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { isNotCausedByUserEvent } from '../../../../../../../common/utils/devExtremeEventsUtils';
import { DisplayType } from '../../../models/rules-table';

@Component({
  selector: 'rolap-rules-table-comparison-cell',
  templateUrl: './rules-table-comparison-cell.component.html',
  styleUrls: ['./rules-table-comparison-cell.component.css'],
})
export class RulesTableComparisonCellComponent implements OnChanges, OnDestroy {
  @Input() uuid: string;
  @Input() displayType: DisplayType;
  public isRelationOneToMany: boolean;
  public isChecked: boolean;
  public isDisabled: boolean;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['uuid']) this.setUp();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public oneToManyValueChange(event: any): void {
    if (!event) return;
    this.updateCurrentTableRowCompareState();
  }

  public manyToManyValueChange(e: ValueChangedEvent): void {
    if (isNotCausedByUserEvent(e)) return;
    if (this.displayType === RuleTableUse.RULE_COMPARISON_SECOND_TABLE) return this.storeSelectedRows();
    this.updateCurrentTableRowCompareState();
  }

  private updateCurrentTableRowCompareState(): void {
    this.store.dispatch(
      V2RulesTableActions.updateCurrentTableRowCompareState({
        rowUuid: this.uuid,
        isRelationOneToMany: this.isRelationOneToMany,
      }),
    );
  }

  private setUp(): void {
    this.ngUnsubscribe.next();

    // Define the observables
    const relationType$ = this.store.select(selectCurrentV2ComparisonFormRelationType).pipe(filterOutNullish());

    let getSelectedRowsUuidsObservable$: Observable<string[]>;

    if (this.displayType === SubTabsNames.RULE_COMPARISON) {
      getSelectedRowsUuidsObservable$ = this.store
        .select(selectCurrentV2RulesTableCompareUuids)
        .pipe(filterOutNullish(), takeUntil(this.ngUnsubscribe));
    } else if (this.displayType === RuleTableUse.RULE_COMPARISON_SECOND_TABLE) {
      getSelectedRowsUuidsObservable$ = this.store
        .select(selectComparisonSelectedRowsUUIDs)
        .pipe(filterOutNullish(), takeUntil(this.ngUnsubscribe));
    } else {
      throw new Error('unsupported display type');
    }

    // Combine the observables and subscribe to their combined emissions
    combineLatest([relationType$, getSelectedRowsUuidsObservable$])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(([relation, uuids]) => {
        this.setIsChecked(uuids, relation);
      });
  }

  private setIsChecked(uuids: string[], isRelationOneToMany: boolean): void {
    if (this.displayType === RuleTableUse.RULE_COMPARISON_SECOND_TABLE) {
      //For the second table we want to allow the user to select multiple rows
      this.isRelationOneToMany = false;
    } else if (this.displayType === SubTabsNames.RULE_COMPARISON) {
      //For the first table we want to set the relation type based on the form value.
      this.isRelationOneToMany = isRelationOneToMany;
    }
    this.isChecked = uuids.includes(this.uuid);
  }

  private storeSelectedRows(): void {
    this.store.dispatch(V2ComparisonActions.toggleSelectedRow({ uuid: this.uuid }));
  }
}
