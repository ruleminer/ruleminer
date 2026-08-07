import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { FilterOperators } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';
import { V2RulesCoverageTabActions } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.actions';
import { getCurrentTabRulesFilterOperator } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.selectors';

@Component({
  selector: 'rolap-coverage-table-rules-filter-operator-selector',
  templateUrl: './coverage-table-rules-filter-operator-selector.component.html',
  styleUrls: ['./coverage-table-rules-filter-operator-selector.component.scss'],
})
export class CoverageTableRulesFilterOperatorSelectorComponent implements OnInit, OnDestroy {
  @Output() operatorChange = new EventEmitter<FilterOperators>();

  public readonly FilterOperators = FilterOperators;
  public operatorsChoice: string[] = Object.values(FilterOperators);
  public value: FilterOperators;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store
      .select(getCurrentTabRulesFilterOperator)
      .pipe(filterOutNullish(), takeUntil(this.ngUnsubscribe))
      .subscribe((operator: FilterOperators) => {
        const firstValue = this.value === undefined;
        this.value = operator;
        if (firstValue) this.operatorChange.emit(this.value);
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onFilterOperatorChange() {
    this.store.dispatch(V2RulesCoverageTabActions.setRulesFilterOperator({ filterOperator: this.value }));
    this.operatorChange.emit(this.value);
  }
}
