import { Component, DestroyRef, Input, SimpleChanges, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { distinctUntilChanged, firstValueFrom, map } from 'rxjs';

import { Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';

import { AppState } from '../../../../common/store/app-state.model';
import { V2ClassifyCardActions } from '../../../../common/store/v2Classify/v2Classify.action';
import {
  selectClassifyAndFirstTimeLoading,
  selectProjectExampleResults,
} from '../../../../common/store/v2Classify/v2Classify.selectors';
import { ClassifyService } from '../classify.service';

@Component({
  selector: 'rolap-project-example-item',
  templateUrl: './project-example-item.component.html',
  styleUrls: ['./project-example-item.component.scss'],
})
export class ProjectExampleItemComponent {
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  @Input({ required: true }) cardId: string;
  @Input({ required: true }) index: number;

  public selectedExampleIndex: number;
  public dataCy: string;
  public dataSource: DataSource;

  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  private classifyService = inject(ClassifyService);
  public columns = this.classifyService.columns;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['index']) {
      this.dataCy = `example-data-grid-${this.index}`;
    }
  }

  ngOnInit() {
    this.dataSource = new DataSource({
      load: async () => {
        const id = this.cardId;
        const data = await firstValueFrom(
          this.store.select(selectClassifyAndFirstTimeLoading).pipe(
            filterOutNullish(),
            map((classify) => classify.cards.find((card) => card.id === id)),
            map((card) => card?.exampleTable),
            filterOutNullish(),
          ),
        );

        return {
          data: data,
          totalCount: data.length,
        };
      },
      update: async (key, values) => {
        const oldData = key;
        const newData = values;
        const updatedData = {
          exampleTable: [
            {
              ...oldData,
              ...newData,
            },
          ],
          key: this.cardId,
        };

        this.store.dispatch(V2ClassifyCardActions.updateExampleTable(updatedData));
      },
    });

    // this is for reloading data grid when row is choosed from project-example-item-select to refresh data
    this.store
      .select(selectProjectExampleResults)
      .pipe(
        filterOutNullish(),
        map((classify) => classify.classifyCards.find((card) => card.id === this.cardId)),
        map((card) => card?.exampleTable),
        filterOutNullish(),
        distinctUntilChanged((prev, curr) => {
          if (prev[0]['#'] === curr[0]['#']) return true;
          return false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.dataSource.reload();
      });
  }

  public close(): void {
    const props = { key: this.cardId };
    this.store.dispatch(V2ClassifyCardActions.remove(props));
  }
}
