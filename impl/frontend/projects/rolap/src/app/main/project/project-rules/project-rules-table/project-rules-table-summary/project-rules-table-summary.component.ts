import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../../common/store/app-state.model';
import { selectCurrentV2RulesTableFilteredUuids } from '../../../../../common/store/v2RulesTable/v2RulesTable.selectors';

@Component({
  selector: 'rolap-project-rules-table-summary',
  templateUrl: './project-rules-table-summary.component.html',
})
export class ProjectRulesTableSummaryComponent {
  private store = inject(Store<AppState>);
  private filteredUuidsSignal = toSignal(this.store.select(selectCurrentV2RulesTableFilteredUuids));

  public numberOfFilteredRows = computed(() => this.filteredUuidsSignal()?.length ?? 0);
  public isNumberOfFilteredRowZero = computed(() => this.numberOfFilteredRows() === 0);
}
