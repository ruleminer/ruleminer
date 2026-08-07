import { Component, Input, OnChanges } from '@angular/core';

import { faBallotCheck } from '@fortawesome/pro-solid-svg-icons';
import { CellPreparedEvent } from 'devextreme/ui/data_grid';
import Menu from 'devextreme/ui/menu';
import { RowType } from 'projects/rolap/src/app/common/interfaces/table.model';

import { CorrelationMatrix } from '../../../models/project';

@Component({
  selector: 'rolap-dataset-correlation-table',
  templateUrl: './dataset-correlation-table.component.html',
  styleUrls: ['./dataset-correlation-table.component.scss'],
})
export class DatasetCorrelationTableComponent implements OnChanges {
  @Input() correlationMatrix: CorrelationMatrix;
  public data: Record<string, number | string>[];
  public columns: any[];
  public faBallotCheck = faBallotCheck;

  ngOnChanges() {
    if (!this.correlationMatrix) return;
    this.prepareData(this.correlationMatrix);
  }

  public onCellPrepared(event: CellPreparedEvent): void {
    if (event.rowType === RowType.FILTER) {
      this.customizeFilterClearIcon(event);
    }
  }
  private prepareData(correlationMatrix: CorrelationMatrix) {
    const preparedData: Record<string, number | string>[] = correlationMatrix.z.map((z: number[], i: number) => {
      const record: Record<string, number | string> = {
        // such fancy names cause '<' and '>' are forbidden in dataset attributes names and will be unique
        '<id>': `${correlationMatrix.x[i]}_${correlationMatrix.y[i]}`,
        '<column_name>': correlationMatrix.y[i],
      };
      correlationMatrix.x.forEach((x: string, j: number) => {
        record[x] = z[j];
      });
      return record;
    });
    this.data = preparedData;
    // no caption for the first column
    const columns: any[] = this.correlationMatrix.x.map((x: string) => ({
      dataField: x,
      caption: x,
      dataType: 'number',
      allowFiltering: true,
      allowSorting: true,
      alignment: 'right',
      allowHiding: true,
    }));
    columns.unshift({
      dataField: '<column_name>',
      caption: null,
      dataType: 'string',
      allowFiltering: false,
      allowSorting: true,
      alignment: 'right',
      fixed: true,
      fixedPosition: 'left',
      allowHiding: false,
    });
    this.columns = columns;
  }

  private customizeFilterClearIcon(event: CellPreparedEvent) {
    const menuElement = event.cellElement.querySelector('.dx-filter-menu');
    if (menuElement) {
      const menu = <Menu>Menu.getInstance(menuElement);
      const subItems: any = menu.option('items[0].items');
      subItems[subItems.length - 1].icon = 'filter-operation-clear';
      menu.option('items[0].items', subItems);
    }
  }
}
