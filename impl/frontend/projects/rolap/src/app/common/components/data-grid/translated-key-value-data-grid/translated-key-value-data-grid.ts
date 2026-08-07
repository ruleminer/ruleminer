import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

import { Subject, Subscription, map, switchMap, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import dxDataGrid, { ContentReadyEvent } from 'devextreme/ui/data_grid';
import { fromPairs, last, sortBy } from 'lodash';

import { AppState } from '../../../store/app-state.model';
import { selectIndicatorsDescriptions } from '../../../store/indicatorsMeta/indicatorsMeta.selectors';
import { mapBackendColumnNameToTranslateValue } from '../../../utils/dataGridUtils';
import { TooltipComponent } from '../../tooltip/tooltip.component';

export type KeyValueItem = { [key: string]: string | number | boolean | undefined | any };
@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, DxDataGridModule, TooltipComponent],
  selector: 'rolap-translated-key-value-data-grid',
  templateUrl: './translated-key-value-data-grid.html',
  styles: [],
})
export class TranslatedKeyValueDataGridComponent implements OnChanges, OnDestroy {
  @Input() set data(value: Record<string, string | number | boolean | undefined>) {
    if (value && typeof value === 'object') {
      this._data = Object.entries(value).map(([key, val]) => ({
        originalKey: key,
        key: mapBackendColumnNameToTranslateValue(key),
        value: val,
      }));
      this.setData();
    }
  }
  @Input() height: string;
  @Input() translationKey = 'project.rules.table.headers';
  @Input() maxHeight = 195;
  @Input() maxRowsBeforeFixedHeight = 4;
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  public dataSource: DataSource<KeyValueItem>;
  public dataGridHeight = '195px';
  public hasData = false;
  public finalHeight: string;
  public indicatorsDescriptions = this.store.selectSignal(selectIndicatorsDescriptions);
  private _data: KeyValueItem[] = [];
  private isHeightSet = false;
  private ngUnsubscribe: Subject<void> = new Subject();
  private translationData: { [key: string]: string } = {};
  private langChangeSubscription: Subscription;
  private readonly columnsToDisplay = ['key', 'value'];

  constructor(private translate: TranslateService, private store: Store<AppState>) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['translationKey']) this.setupOnLangChange();
    this.setHeight();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.langChangeSubscription.unsubscribe();
  }

  public customizeColumns = ((columns: DxiDataGridColumn[]) => {
    columns.forEach((column) => {
      if (!this.columnsToDisplay.includes(column.dataField!)) {
        column.visible = false;
      }
      if (column.dataField === 'key') {
        column.cellTemplate = 'keyCellTemplate';
      }
      column.headerCellTemplate = 'translateTemplateHeader';
      column.alignment = 'left';
    });
  }).bind(this);

  public onContentReady(e: ContentReadyEvent): void {
    const dataGrid = e.component;
    this.setDxDataGridHeight(dataGrid);
  }

  private setDxDataGridHeight(dataGrid: dxDataGrid): void {
    if (this.isHeightSet || !dataGrid) return;

    this.isHeightSet = true;
    const rows = dataGrid.getVisibleRows();

    const BASE_HEIGHT = 39;
    const ROW_HEIGHT = 31;
    const MAX_HEIGHT = this.maxHeight;
    const MAX_ROWS_BEFORE_FIXED_HEIGHT = this.maxRowsBeforeFixedHeight;

    const dynamicHeight = BASE_HEIGHT + ROW_HEIGHT * rows.length;
    this.dataGridHeight = rows.length > MAX_ROWS_BEFORE_FIXED_HEIGHT ? `${MAX_HEIGHT}px` : `${dynamicHeight}px`;
  }

  private setData(): void {
    this.translate
      .get(this.translationKey)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((translationData: Record<string, string>) => {
        this.translationData = translationData;
        this.updateDataSourceWithTranslatedValues();
      });
  }

  private updateDataSourceWithTranslatedValues(): void {
    let translatedData = this._data.map((obj) =>
      fromPairs(
        Object.entries(obj).map(([key, value]) => {
          return [key, typeof value === 'string' ? this.translateFromMap(value) : value];
        }),
      ),
    );
    translatedData = sortBy(translatedData, 'key');
    this.isHeightSet = false;
    this.hasData = translatedData.length > 0;
    this.dataSource = new DataSource({
      store: new ArrayStore({
        data: [...translatedData],
      }),
    });
  }

  private translateFromMap = (key: string): string => last((this.translationData[key] || key).split('.')) || key;

  private setupOnLangChange(): void {
    this.langChangeSubscription?.unsubscribe();
    this.langChangeSubscription = this.translate.onLangChange
      .pipe(
        switchMap(() => {
          return this.translate.get(this.translationKey).pipe(
            map((translationData) => {
              return { translationData };
            }),
          );
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((data) => {
        this.translationData = data.translationData;
        this.updateDataSourceWithTranslatedValues();
      });
  }

  private setHeight(): void {
    if (this._data.length < 5) {
      this.finalHeight = 'auto';
    } else {
      this.finalHeight = this.height ? this.height : this.dataGridHeight;
    }
  }
}
