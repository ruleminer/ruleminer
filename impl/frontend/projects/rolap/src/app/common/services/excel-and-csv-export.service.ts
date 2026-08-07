import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { exportDataGrid as excelExportDataGrid } from 'devextreme/excel_exporter';
import dxDataGrid from 'devextreme/ui/data_grid';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { lowerFirst } from 'lodash';

import { ProblemTypes } from '../../main/data-upload/utils/enums';
import { ExportType } from '../../main/project/project-rules/project-rules-table/models/export-type';
import { ColumnExportExcludeService } from '../../main/project/service/columnExportExclude.service';
import { DataField } from '../../main/project/service/models/rules-customize-columns-api';
import { RulesCustomizeColumnsService } from '../../main/project/service/rules-customize-columns.service';
import { RuleTableUse, SubTabsNames } from '../store/app-state.model';

const MEDIAN_SURVIVAL_TIME = 'median_survival_time';
@Injectable({
  providedIn: 'root',
})
export class ExcelAndCsvExportService {
  public exportCount: number | undefined;

  constructor(
    private translateService: TranslateService,
    private rulesCustomizeColumnsService: RulesCustomizeColumnsService,
    private columnExportExcludeService: ColumnExportExcludeService,
  ) {}

  exportData(
    format: ExportType,
    component: DxDataGridComponent,
    prefixName = 'DataGrid',
    isBigTable: boolean = false,
    displayType: SubTabsNames | RuleTableUse,
    problemType: ProblemTypes,
  ) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Employees');
    const instance = component.instance;
    const columnsToExclude = this.columnExportExcludeService.getExcludedColumns(problemType);

    if (columnsToExclude.length) {
      instance.beginUpdate();
      this.changeColumnsVisibleState(instance, columnsToExclude, false);
    }

    excelExportDataGrid({
      component: instance,
      worksheet,
      autoFilterEnabled: true,
      selectedRowsOnly: false,
    })
      .then(() => {
        // For the big table we need to set the header row manually, because we want to translate the headers
        if (isBigTable) {
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell) => {
            const dataField = lowerFirst(`${cell.value}`.replace(/\s/g, '')) as DataField; // remove spaces first letter lowercase
            const translateKey = this.rulesCustomizeColumnsService.getHeaderTextBasedOnDataField(
              dataField,
              displayType,
              problemType,
            );

            cell.value = this.translateService.instant('project.rules.table.headers.' + translateKey);
          });
        }

        if (format === ExportType.XLSX) {
          workbook.xlsx.writeBuffer().then((buffer) => {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), prefixName + '.xlsx');
          });
        } else if (format === ExportType.CSV) {
          workbook.csv.writeBuffer().then((buffer) => {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), prefixName + '.csv');
          });
        }
      })
      .then(() => {
        this.changeColumnsVisibleState(instance, columnsToExclude, true);
        instance.endUpdate();
      });
  }

  exportDataTxt(
    prefixName = 'DataGrid',
    problemType: ProblemTypes,
    decisionAttribute: string,
    component: DxDataGridComponent,
  ) {
    const table = component.instance.getDataSource();
    const tableData = table.items();

    const decisionAttr = problemType !== ProblemTypes.Survival ? decisionAttribute : MEDIAN_SURVIVAL_TIME;
    let processedText = '';
    if (tableData.length > 0) {
      processedText += '';

      for (let i = 0; i < tableData.length; i++) {
        const currentElement = tableData[i];
        let conclusionRange = '';

        if (problemType === ProblemTypes.Regression && currentElement.displayConclusion) {
          const lowValue = currentElement.displayConclusion.low;
          const highValue = currentElement.displayConclusion.high;
          if (lowValue !== undefined && highValue !== undefined) {
            conclusionRange = ` [${lowValue.toFixed(2)}, ${highValue.toFixed(2)}]`;
          }
        }
        const string = currentElement.displayString;
        const conclusionValue = currentElement.conclusion.value;
        const conclusion =
          typeof conclusionValue === 'number' ? parseFloat(conclusionValue.toFixed(2)).toString() : conclusionValue;

        const ruleText = `IF ${string} THEN ${decisionAttr} = {${conclusion}}${
          problemType === ProblemTypes.Regression ? conclusionRange : ''
        }`;
        processedText += `${ruleText}\n`;
      }
    }
    saveAs(new Blob([processedText], { type: 'text/plain' }), prefixName + '.txt');
  }

  exportBlobCsv(data: any, fileName: string) {
    const blob = new Blob([data], { type: 'text/csv' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  }

  private changeColumnsVisibleState(instance: dxDataGrid<any, any>, columns: DataField[], value: boolean) {
    for (let i = 0; i < columns.length; i++) {
      instance.columnOption(columns[i], 'visible', value);
    }
  }
}
