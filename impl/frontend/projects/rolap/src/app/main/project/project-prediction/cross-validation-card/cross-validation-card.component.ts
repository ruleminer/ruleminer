import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { mapKeys, snakeCase } from 'lodash';

@Component({
  selector: 'rolap-cross-validation-card',
  templateUrl: './cross-validation-card.component.html',
  styleUrls: ['./cross-validation-card.component.scss'],
})
export class CrossValidationCardComponent implements OnInit, OnChanges {
  @Input() crossValidation: any;
  public dataSource: DataSource;
  public numOfFolds: number | null;
  ngOnInit(): void {
    this.setData();
  }

  ngOnChanges(): void {
    this.setData();
  }

  public customizeColumns(columns: DxiDataGridColumn[]) {
    columns.forEach((column) => {
      column.headerCellTemplate = `translateTemplateHeader`;
      column.alignment = 'left';
    });
  }

  public originalOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>): number => 0;

  private setData(): void {
    const newArray = this.crossValidation.table.map((item: any) => {
      item = mapKeys(item, (value, key) => {
        return snakeCase(key.replace(/ /g, '_').replace(/-/g, '_'));
      });
      const keys = Object.keys(item);
      const mappedObject: any = {};
      const isBold = item.name === 'avg';
      //Change the column names to snake case and replace spaces and hyphens with underscores to match with translations
      const formattedColumnNames = keys.map((name) => snakeCase(name.replace(/ /g, '_').replace(/-/g, '_')));

      formattedColumnNames.forEach((key) => {
        mappedObject[key] = { value: item[key], isBold };
      });
      return mappedObject;
    });

    this.dataSource = new DataSource({
      store: new ArrayStore({
        data: newArray,
      }),
    });

    this.numOfFolds = this.crossValidation.numOfFolds;
  }
}
