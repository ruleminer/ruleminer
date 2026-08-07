//TODO: REMOVE THIS FILE USE SERVICE INSTEAD :))
import { DxDataGridComponent } from 'devextreme-angular';
import { exportDataGrid as excelExportDataGrid } from 'devextreme/excel_exporter';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

export interface DataGridComponent {
  exportCount: number | undefined;
  getTotalCount(): number;
  getDataGrid(): DxDataGridComponent;
}

/**
 * Utility class for exporting data.
 */
export class Exporter {
  /**
   * Exports data from a DataGridComponent to a file in the specified format.
   * @param format - The format of the exported file ('xlsx' or 'csv').
   * @param component - The DataGridComponent instance.
   * @param prefixName - The prefix name for the exported file (default: 'DataGrid').
   */
  public static exportData(format: string, component: DataGridComponent, prefixName = 'DataGrid') {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Data');
    component.exportCount = component.getTotalCount();
    excelExportDataGrid({
      component: component.getDataGrid().instance,
      worksheet,
      autoFilterEnabled: true,
      selectedRowsOnly: false,
      customizeCell: (options) => {
        const value = options.gridCell?.value;
        if (value && typeof value === 'object') {
          try {
            const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
            if (parsedValue.title) {
              options.excelCell.value = parsedValue.title;
            } else {
              const firstValue = Object.values(parsedValue)[0];
              options.excelCell.value = firstValue?.toString() || '';
            }
          } catch (e) {
            options.excelCell.value = value.toString();
          }
        }
      },
    }).then(() => {
      component.exportCount = undefined;

      if (format === 'xlsx') {
        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(new Blob([buffer], { type: 'application/octet-stream' }), prefixName + '.xlsx');
        });
      } else if (format === 'csv') {
        workbook.csv.writeBuffer().then((buffer) => {
          saveAs(new Blob([buffer], { type: 'application/octet-stream' }), prefixName + '.csv');
        });
      }
    });
  }

  /**
   * Exports data as a CSV file from a given data and file name.
   * @param data - The data to be exported as CSV.
   * @param fileName - The name of the exported file.
   */
  public static exportBlobCsv(data: any, fileName: string) {
    const blob = new Blob([data], { type: 'text/csv' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  }

  /**
   * Downloads a report as a file with the specified content and filename.
   * @param content - The content of the report.
   * @param filename - The name of the downloaded file.
   */
  public static downloadReport(content: string, filename: string): void {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}
