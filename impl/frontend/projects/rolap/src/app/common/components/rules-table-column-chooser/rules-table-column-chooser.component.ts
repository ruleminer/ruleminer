import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { DxListModule } from 'devextreme-angular';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import DataSource from 'devextreme/data/data_source';
import { SelectionChangedEvent } from 'devextreme/ui/list';

import { ProblemTypes } from '../../../main/data-upload/utils/enums';
import { RulesTableHeaderTextComponent } from '../../../main/project/project-rules/project-rules-table/columns/headers/rules-table-header-text/rules-table-header-text.component';
import { DatasetCustomizeColumnsService } from '../../../main/project/service/dataset-customize-columns.service';
import { RulesCustomizeColumnsService } from '../../../main/project/service/rules-customize-columns.service';
import { RuleTableUse, SubTabsNames } from '../../store/app-state.model';
import { FilteredColumns } from '../data-grid/dataset-view-table/types';

// Extend DxiDataGridColumn to include our custom properties
interface ExtendedDataGridColumn extends DxiDataGridColumn {
  orderInColumnChooser?: number;
}

const fadeInOut = trigger('fadeInOut', [
  state('open', style({ transform: 'translateX(0)' })),
  state('close', style({ transform: 'translateX(100%)' })),
  transition('close => open', [animate('.3s ease-out')]),
  transition('open => close', [animate('.3s ease-out')]),
]);

@Component({
  selector: 'rolap-rules-table-column-chooser',
  templateUrl: './rules-table-column-chooser.component.html',
  styleUrls: ['./rules-table-column-chooser.component.scss'],
  animations: [fadeInOut],
  standalone: true,
  imports: [CommonModule, TranslateModule, DxListModule, FontAwesomeModule, RulesTableHeaderTextComponent],
})
export class RulesTableColumnChooserComponent implements OnChanges {
  @Input() columns: ExtendedDataGridColumn[];
  @Input() isShown: boolean;
  @Input() specialColumns: FilteredColumns[] = [];
  @Input() displayType: SubTabsNames | RuleTableUse;
  @Input() problemType: ProblemTypes;

  @Output() isShownChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();
  @Output() columnChange = new EventEmitter<{ dataField: string; visible: boolean }>();
  public faTimes = faTimes;
  public dataSource: DataSource;
  public selectedItemKeys: string[] = [];
  private rulesCustomizeColumnsService = inject(RulesCustomizeColumnsService);
  private datasetCustomizeColumnsService = inject(DatasetCustomizeColumnsService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] || changes['displayType'] || changes['problemType'] || changes['specialColumns']) {
      this.setDataSource();
    }
  }

  public closeColumnChooser(): void {
    this.close.emit();
  }

  public onColumnSelect(event: SelectionChangedEvent): void {
    const { addedItems, removedItems } = event;
    if (addedItems.length > 0) return this.addColumn(addedItems[0].dataField);
    if (removedItems.length > 0) return this.removeColumn(removedItems[0].dataField);
  }

  private addColumn(column: string): void {
    this.columnChange.emit({ dataField: column, visible: true });
  }

  private removeColumn(column: string): void {
    this.columnChange.emit({ dataField: column, visible: false });
  }

  private setDataSource(): void {
    const store = [...this.columns]
      .filter((col) => col.showInColumnChooser)

      .map((column) => {
        const isDisabledInColumChooser = this.shouldDisableColumnInChooser(
          column.dataField as string,
          this.displayType,
        );

        return {
          dataField: column.dataField,
          caption: column.caption,
          disabled: isDisabledInColumChooser,
          visibleIndex: column.visibleIndex,
          orderInColumnChooser: column.orderInColumnChooser,
        };
      })
      .sort((a, b) => {
        const isDisabledA = a.disabled;
        const isDisabledB = b.disabled;
        if (isDisabledA && !isDisabledB) return 1;
        if (!isDisabledA && isDisabledB) return -1;

        // Use orderInColumnChooser if available, otherwise fall back to visibleIndex
        const aIndex = a.orderInColumnChooser ?? a.visibleIndex ?? 0;
        const bIndex = b.orderInColumnChooser ?? b.visibleIndex ?? 0;
        return aIndex - bIndex;
      });
    const key = 'dataField';
    this.selectedItemKeys = [...this.columns]
      .filter((column) => column.visible)
      .map((column) => column.dataField as string)
      .filter(Boolean);
    this.dataSource = new DataSource({ store, key });
  }

  private shouldDisableColumnInChooser(column: string, displayType: SubTabsNames | RuleTableUse): boolean {
    let config: any;

    if (displayType === SubTabsNames.DATASET) {
      config = this.datasetCustomizeColumnsService.getConfig(this.problemType, displayType as any);
    } else {
      config = this.rulesCustomizeColumnsService.getConfig(this.problemType, displayType as any);
    }

    return config && config[column] && config[column].allowHiding === false;
  }
}
