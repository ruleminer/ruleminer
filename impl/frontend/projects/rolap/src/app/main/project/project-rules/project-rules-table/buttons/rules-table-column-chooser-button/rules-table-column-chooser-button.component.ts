import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { faBallotCheck } from '@fortawesome/pro-solid-svg-icons';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';

import { SelectColumnsBtnComponent } from '../../../../../../common/components/buttons/select-columns-btn/select-columns-btn.component';
import { RulesTableColumnChooserComponent } from '../../../../../../common/components/rules-table-column-chooser/rules-table-column-chooser.component';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { DisplayType } from '../../models/rules-table';

@Component({
  selector: 'rolap-rules-table-column-chooser-button',
  templateUrl: './rules-table-column-chooser-button.component.html',
  styleUrls: ['./rules-table-column-chooser-button.component.scss'],
  standalone: true,
  imports: [CommonModule, RulesTableColumnChooserComponent, SelectColumnsBtnComponent],
})
export class RulesTableColumnChooserButtonComponent {
  @Input() allColumns: DxiDataGridColumn[] = [];
  @Input() displayType: DisplayType;
  @Input() problemType: ProblemTypes;
  @Input() dataGrid: DxDataGridComponent;
  public showCustomColumnChooser = false;
  public faBallotCheck = faBallotCheck;

  public toggleCustomColumnChooser(): void {
    this.showCustomColumnChooser = !this.showCustomColumnChooser;
  }

  public closeCustomColumnChooser(): void {
    this.showCustomColumnChooser = false;
  }

  public columnChange(event: { dataField: string; visible: boolean }): void {
    this.dataGrid.instance.beginUpdate();
    const largestVisibleIndex = Math.max(
      ...(this.dataGrid.instance.getVisibleColumns().map((col) => col.visibleIndex) as number[]),
    );
    this.dataGrid.instance.columnOption(event.dataField, 'visible', event.visible);
    this.dataGrid.instance.columnOption(event.dataField, 'visibleIndex', largestVisibleIndex + 1);
    this.dataGrid.instance.endUpdate();
  }
}
