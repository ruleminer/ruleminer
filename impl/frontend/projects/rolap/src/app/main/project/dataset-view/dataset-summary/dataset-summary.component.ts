import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { map } from 'rxjs';

import { Store } from '@ngrx/store';

import { SummaryItemSpanComponent } from '../../../../common/components/summary-item-span/summary-item-span.component';
import { getCurrentStatistic } from '../../../../common/store/ruleSets/rulesets.selectors';
import { getCurrentV2DataSetTableFilteredCount } from '../../../../common/store/v2DataSetTable/v2DataSetTable.selectors';

@Component({
  selector: 'rolap-dataset-summary',
  templateUrl: './dataset-summary.component.html',
  standalone: true,
  imports: [SummaryItemSpanComponent, CommonModule],
})
export class DatasetSummaryComponent {
  private store = inject(Store);

  public filteredCountSignal = this.store.selectSignal(getCurrentV2DataSetTableFilteredCount);

  public summarySignal = toSignal(
    this.store.select(getCurrentStatistic).pipe(map((currentStatistics) => currentStatistics?.summary)),
    { initialValue: undefined },
  );

  public numberOfRows = computed(() => {
    const summary = this.summarySignal();
    return summary?.number_of_rows;
  });

  public showFilteredCount = computed(() => {
    const currentFilteredCount = this.filteredCountSignal();
    const currentNumberOfRows = this.numberOfRows();
    if (currentFilteredCount === undefined || currentNumberOfRows === undefined) return false;
    return currentNumberOfRows !== currentFilteredCount;
  });
}
