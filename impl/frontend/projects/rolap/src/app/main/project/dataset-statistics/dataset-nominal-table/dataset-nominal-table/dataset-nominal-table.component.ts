import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { Observable, Subject, takeUntil } from 'rxjs';

import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';

enum DataField {
  MISSING_VALUES_COUNT = 'missing_values_count',
}
@Component({
  selector: 'rolap-dataset-nominal-table',
  templateUrl: './dataset-nominal-table.component.html',
  styleUrls: ['./dataset-nominal-table.component.scss'],
})
export class DatasetNominalTableComponent implements OnChanges, OnDestroy {
  @Input() dataSource: Observable<any[]>;
  @Input() attributes: any;

  private ngUnsubscribe: Subject<void> = new Subject();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['attributes']) this.initializeComponent();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  public customizeColumns(columns: DxiDataGridColumn[]) {
    columns.forEach((column) => {
      if (column.dataField === DataField.MISSING_VALUES_COUNT) {
      }
      column.headerCellTemplate = 'translateTemplateHeader';
    });
  }

  private initializeComponent() {
    this.dataSource.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data: any[]) => this.setUpChips(data));
  }

  private setUpChips(data: any): void {
    for (const key in data) {
      const element = data[key];

      if (!this.attributes) return;

      const entries = Object.entries(this.attributes);
      entries.forEach(([key, value]) => {
        if (key !== element.attributes) return;

        element.detail = value;
      });
    }
  }
}
