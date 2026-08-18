import { Injectable } from '@angular/core';

import { RowPreparedEvent } from 'devextreme/ui/data_grid';

import { RowType } from '../../interfaces/table.model';

@Injectable({
  providedIn: 'root',
})
export class RowSelectService {
  /**
   * Selects the row in the table on which you right-clicked.
   *
   * @param event - row prepared event
   */
  public rightClickRowSelect(event: RowPreparedEvent) {
    if (event.rowType === RowType.DATA) {
      event.rowElement.oncontextmenu = (args: any) => {
        event.component.selectRows([event.key], true);
        args.preventDefault();
      };
    }
  }
}
