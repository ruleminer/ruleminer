import { Component, OnDestroy } from '@angular/core';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { Subject, combineLatest, take, takeUntil } from 'rxjs';

import { faFile } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../common/store/app-state.model';
import {
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
} from '../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabText } from '../../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { convertRulesBigTableForBackend } from '../../../../../data-upload/utils/utils';

@Component({
  selector: 'rolap-rules-table-export-json-button',
  templateUrl: './rules-table-export-json-button.component.html',
  styleUrls: ['./rules-table-export-json-button.component.scss'],
})
export class RulesTableExportJsonButtonComponent implements OnDestroy {
  public faFile = faFile;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public export(): void {
    combineLatest([
      this.store.select(selectCurrentV2TabText),
      this.store.select(selectCurrentV2RulesTable).pipe(filterOutNullish()),
      this.store.select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered).pipe(filterOutNullish()),
    ])
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe(([v2TabText, v2RulesTable, activeAndFilteredRowsUuids]) => {
        const rules = convertRulesBigTableForBackend(v2RulesTable.data).filter((rule) =>
          activeAndFilteredRowsUuids.includes(rule.uuid),
        );
        const meta = v2RulesTable.meta;
        const jsonObject = { meta, rules };
        const data = JSON.stringify(jsonObject);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${v2TabText}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
