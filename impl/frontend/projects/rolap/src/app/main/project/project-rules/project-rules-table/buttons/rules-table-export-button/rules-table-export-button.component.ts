import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import {
  ExportDropdownComponent,
  ExportItem,
} from '../../../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { ExcelAndCsvExportService } from '../../../../../../common/services/excel-and-csv-export.service';
import { AppState } from '../../../../../../common/store/app-state.model';
import { selectCurrentV2RulesDecisionAttribute } from '../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import {
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered,
} from '../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabText } from '../../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { convertRulesBigTableForBackend } from '../../../../../data-upload/utils/utils';
import { ExportType } from '../../models/export-type';
import { DisplayType } from '../../models/rules-table';

@Component({
  selector: 'rolap-rules-table-export-button',
  template: ` <rolap-export-dropdown [exportItems]="exportItems"></rolap-export-dropdown> `,
  standalone: true,
  imports: [CommonModule, TranslateModule, FontAwesomeModule, ExportDropdownComponent],
})
export class RulesTableExportButtonComponent {
  @Input() dataGrid: DxDataGridComponent;
  @Input() ruleSetId: number;
  @Input() displayType: DisplayType;
  @Input() problemType: ProblemTypes;

  private excelAndCsvExportService = inject(ExcelAndCsvExportService);
  private store = inject(Store<AppState>);

  private decisionAttributeSignal = toSignal(this.store.select(selectCurrentV2RulesDecisionAttribute));

  public exportItems: ExportItem[] = [
    {
      text: ExportType.CSV,
      onClick: () => this.export(ExportType.CSV),
    },
    {
      text: ExportType.XLSX,
      onClick: () => this.export(ExportType.XLSX),
    },
    {
      text: ExportType.TXT,
      onClick: () => this.exportTxt(),
    },
    {
      text: ExportType.JSON,
      onClick: () => this.exportJson(),
    },
  ];

  public export(format: ExportType): void {
    this.excelAndCsvExportService.exportData(
      format,
      this.dataGrid,
      'rules_table_' + this.ruleSetId,
      true,
      this.displayType,
      this.problemType,
    );
  }

  public exportTxt(): void {
    const decisionAttribute = this.decisionAttributeSignal();
    if (!decisionAttribute) return;
    this.excelAndCsvExportService.exportDataTxt(
      'rules_table_' + this.ruleSetId,
      this.problemType,
      decisionAttribute,
      this.dataGrid,
    );
  }

  public exportJson(): void {
    combineLatest([
      this.store.select(selectCurrentV2TabText),
      this.store.select(selectCurrentV2RulesTable).pipe(filterOutNullish()),
      this.store.select(selectCurrentV2RulesTableUUidsThatAreActiveAndFiltered).pipe(filterOutNullish()),
    ])
      .pipe(take(1))
      .subscribe(([v2TabText, v2RulesTable, activeAndFilteredRowsUuids]) => {
        const rules = convertRulesBigTableForBackend(v2RulesTable.data).filter((rule) =>
          activeAndFilteredRowsUuids.includes(rule.uuid),
        );
        const meta = v2RulesTable.meta;
        const jsonObject = { meta, rules };
        const data = JSON.stringify(jsonObject);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${v2TabText}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
