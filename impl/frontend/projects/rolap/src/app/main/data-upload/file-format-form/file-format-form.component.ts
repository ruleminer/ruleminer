import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { take } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import * as Papa from 'papaparse';

import { updateObjectAndRemoveEmptyColumn } from '../../../common/utils/dataGridUtils';
import { DatasetService } from '../../project/dataset/service/dataset.service';
import { SelectedColumnsUploadService } from '../selected-columns-upload.service';
import { ProblemTypes } from '../utils/enums';
import { ColumnNameErrors } from './errors';
import { fileFormatValidator } from './form-validator';
import { FileFormatValues } from './types';

@Component({
  selector: 'rolap-file-format-form',
  templateUrl: './file-format-form.component.html',
  styleUrls: ['./file-format-form.component.scss'],
})
export class FileFormatFormComponent implements OnInit {
  @Input() problemType: ProblemTypes;
  @Output() fileFormatValues = new EventEmitter<FileFormatValues>();
  private translateService = inject(TranslateService);
  private readonly validationRegex = /^[A-Za-zżźćńółęąśŻŹĆŃÓŁĘĄŚ0-9\s\-_\[\]]+$/;
  private readonly maxColumnNameLength = 25;
  private readonly indexColumnName = 'index';

  private originalColumnNames: string[];
  private selectedColumns: string[];
  private _fileData: string | null;

  @Input() set fileData(value: string | null) {
    if (value !== this._fileData) {
      this._fileData = value;
      if (value) {
        this.parseCsv();
        this.setUpFormBasedOnFile();
        this.cdRef.detectChanges();
      }
    }
  }

  get fileData(): string | null {
    return this._fileData;
  }

  public encodings = [];

  public decimalItems = [',', '.'];
  public selectedData: any[] = [];

  public form: FormGroup;
  public errors: ColumnNameErrors;
  private destroyRef = inject(DestroyRef);
  constructor(
    private dataSetService: DatasetService,
    private selectedColumnsUploadService: SelectedColumnsUploadService,
    private cdRef: ChangeDetectorRef,
  ) {
    this.errors = new ColumnNameErrors();
    this.form = new FormGroup(
      {
        hasHeader: new FormControl(true),
        encoding: new FormControl(null, [Validators.required]),
        decimal: new FormControl('.'),
        separator: new FormControl(',', [Validators.required]),
        missingValues: new FormControl(''),
      },
      { validators: fileFormatValidator },
    );
  }

  ngOnInit(): void {
    this.selectedColumnsUploadService.selectedColumns$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedColumns) => {
        this.selectedColumns = selectedColumns;
        this.emitFileFormatValues();
      });

    this.dataSetService
      .getAvailableCodecs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((encodings) => {
        this.encodings = encodings;
        this.form.patchValue({ encoding: this.encodings[0] });
        this.parseCsv();
      });
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.parseCsv();
    });
  }

  private parseCsv(): void {
    if (!this.fileData) return;

    Papa.parse(this.fileData.trim(), {
      header: this.form.value.hasHeader,
      delimiter: this.form.value.separator,
      encoding: this.form.value.encoding,
      complete: (results: any) => {
        let data = results.data;
        if (!this.form.value.hasHeader) {
          const firstRow = data[0];
          const columnCount = firstRow.length;

          const defaultHeaders = Array.from({ length: columnCount }, (_, i) => `Column${i + 1}`);
          data = [defaultHeaders, ...data];

          const papaConfig = { header: true, delimiter: this.form.value.separator };
          data = Papa.parse(Papa.unparse(data, papaConfig), papaConfig).data;
        }

        data = data.map((row: { __parsed_extra: any; [key: string]: any }) => {
          const cleanedRow: any = {};
          Object.entries(row).forEach(([key, value]) => {
            if (key !== '__parsed_extra') {
              cleanedRow[!key || key.startsWith('_') ? `Column ${Object.keys(cleanedRow).length}` : key] = value;
            }
          });
          return cleanedRow;
        });

        const updatedData = updateObjectAndRemoveEmptyColumn(data);
        this.normalizeTable(updatedData);
        this.selectedData = updatedData;

        if (this.selectedData && this.selectedData.length > 0) {
          const dataFields = Object.keys(this.selectedData[0]);
          this.selectedColumnsUploadService.setColumns(dataFields);
        }
      },
    });

    if (this.form.value.hasHeader) {
      this.originalColumnNames = this.fileData
        .split(/\r?\n/)[0]
        .trim()
        .split(this.form.value.separator)
        .map((col, index) => (col === '' ? `Column${index + 1}` : col));
    } else {
      const firstRow = this.fileData.split(/\r?\n/)[0].trim().split(this.form.value.separator);
      this.originalColumnNames = Array.from({ length: firstRow.length }, (_, i) => `Column${i + 1}`);
    }

    this.emitFileFormatValues();
  }
  public customizeColumns = (columns: DxiDataGridColumn[]) => {
    columns.forEach((column, i) => {
      if (this.form.value.separator === '\\t') {
        column.caption = this.originalColumnNames[0].split('\t')[i] || column.caption;
      } else {
        column.caption = this.originalColumnNames[i] || '';
      }
      if (this.validateColumnName(column.caption!).hasErrors) {
        column.cssClass = 'header-error';
      }
      column.alignment = 'left';
      column.headerCellTemplate = 'headerCellTemplate';
    });
  };

  private setUpFormBasedOnFile(): void {
    const fileHasNoData = this.selectedData.length === 0;
    const fileHasOneRow = this.selectedData.length === 1;

    if (fileHasNoData || fileHasOneRow) return this.form.patchValue({ hasHeader: false, hasHeaderDisabled: true });
    this.form.patchValue({ hasHeader: true, hasHeaderDisabled: false });
  }

  private normalizeTable(data: any) {
    const missingValuePlaceholder = this.form.value.missingValues || '';
    // Find the maximum number of cells among all rows
    let maxCells = 0;
    let maxCellsKeys: string[] = [];
    data.forEach((row: any) => {
      const numCells = Object.keys(row).length;
      if (numCells > maxCells) {
        maxCells = numCells;
        maxCellsKeys = Object.keys(row);
      }
    });

    //fill missing cells with the placeholder
    data.forEach((row: any) => {
      maxCellsKeys.forEach((key) => {
        if (row[key] === missingValuePlaceholder) {
          row[key] = '';
        }
      });
    });
  }

  // validate column names and emit file format values
  private emitFileFormatValues(): void {
    this.errors.clearAll();
    const columnsWithErrors: string[] = [];
    const formValue = this.form.value;
    const formValid = this.form.valid;

    if (this.form.value.separator === '\\t') {
      this.selectedColumns[0].split('\t').forEach((originalColumName: string) => {
        const columnErrors = this.validateColumnName(originalColumName);
        if (columnErrors.hasErrors) {
          columnsWithErrors.push(originalColumName);
        }
        this.errors.join(columnErrors);
      });
    } else {
      this.selectedColumns?.forEach((originalColumName: string) => {
        const columnErrors = this.validateColumnName(originalColumName);
        if (columnErrors.hasErrors) {
          columnsWithErrors.push(originalColumName);
        }
        this.errors.join(columnErrors);
      });
    }

    const hasErrors = this.errors.hasErrors;

    this.selectedColumnsUploadService
      .getFileFormatValues(this.selectedData, this.problemType, formValue, formValid, [], hasErrors)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((fileFormatValues) => this.fileFormatValues.emit(fileFormatValues));
  }

  private validateColumnName(columnName: string): ColumnNameErrors {
    const columnErrors = new ColumnNameErrors();

    // check if column name is not duplicated
    const occurrenceCount = this.originalColumnNames.filter((name) => name === columnName).length;
    if (occurrenceCount > 1) {
      columnErrors.columnNameDuplicatedError = true;
    }

    // check if column name is valid
    if (!this.validationRegex.test(columnName)) {
      columnErrors.patternError = true;
    }

    // check if column name is not too long
    if (columnName.length > this.maxColumnNameLength) {
      columnErrors.maxLengthError = true;
    }

    // check if column name is "index" (it is a forbidden column name)
    if (columnName.toLowerCase() === this.indexColumnName) {
      columnErrors.indexColumnPresentError = true;
    }
    return columnErrors;
  }

  private wrapDelimiterIfNeeded(delimiter: string): string {
    if (delimiter === '\\t') {
      return '\t'; //tab charachter is not recognize when delimiter have '\t' value
    }
    return delimiter;
  }
}
