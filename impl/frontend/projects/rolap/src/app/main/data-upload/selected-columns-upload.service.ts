import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, map, of, switchMap } from 'rxjs';

import { pick } from 'lodash';

import { ColumnsTypesDeduceService } from './columns-choice/columns-types-deduce.service';
import { FileFormatValues } from './file-format-form/types';
import { ProblemTypes } from './utils/enums';

/** Service to manage selected columns */
@Injectable()
export class SelectedColumnsUploadService {
  private selectedColumns = new BehaviorSubject<string[]>([]);
  public columnOrder = new Map<string, number>();
  public selectedColumns$ = this.selectedColumns.asObservable();

  constructor(private columnTypesDeduceService: ColumnsTypesDeduceService) {}

  /**
   * Initializes the selected columns and records their original order by updating the `columnOrder` map.
   */
  public setColumns(columns: string[]): void {
    this.columnOrder.clear();
    columns.forEach((col, index) => this.columnOrder.set(col, index));
    this.selectedColumns.next(columns);
  }

  /**
   * Adds a column to the selection while maintaining the original order.
   * This ensures that even if columns are deselected and then reselected, they will appear in the
   * order they were first set.
   *
   * @param column - The column to be added to the selection.
   */
  public addColumn(column: string): void {
    const currentSelection = this.selectedColumns.value;
    if (!this.columnOrder.has(column)) {
      this.columnOrder.set(column, this.columnOrder.size);
    }
    if (!currentSelection.includes(column)) {
      const newSelection = [...currentSelection, column];
      newSelection.sort((a, b) => (this.columnOrder.get(a) ?? 0) - (this.columnOrder.get(b) ?? 0));
      this.selectedColumns.next(newSelection);
    }
  }

  /* Remove a column from the selection */
  public removeColumn(column: string): void {
    const currentSelection = this.selectedColumns.value.filter((col) => col !== column);
    this.selectedColumns.next(currentSelection);
  }

  /* Toggle column selection */
  public toggleColumn(column: string): void {
    const currentSelection = this.selectedColumns.value;
    if (currentSelection.includes(column)) return this.removeColumn(column);
    this.addColumn(column);
  }

  public validateSelectedColumns(problemType: ProblemTypes): Observable<boolean> {
    if (problemType === undefined) return of(false);
    return this.selectedColumns$.pipe(
      map((selectedColumns) => {
        // const dataSource = selectedData.map((obj) => pick(obj, selectedColumns));

        // const results: ColumnsTypesDeducingResult | null = this.columnTypesDeduceService.deduceColumnsTypes(
        //   dataSource,
        //   problemType,
        // );

        // const catColumns = results?.columnsTypes
        //   ? Object.keys(results.columnsTypes).filter((key) => results.columnsTypes[key] === 'cat')
        //   : [];
        // const numColumns = results?.columnsTypes
        //   ? Object.keys(results.columnsTypes).filter((key) => results.columnsTypes[key] === 'num')
        //   : [];

        // const hasCatColumn = catColumns.some((catColumn) => selectedColumns.includes(catColumn));
        // const hasNumColumn = numColumns.some((numColumn) => selectedColumns.includes(numColumn));

        const numberOfSelectedColumns = selectedColumns.length;

        // For regression, we need at least 2 columns selected (target variable and at least one feature)
        if (problemType === ProblemTypes.Regression) {
          const result = numberOfSelectedColumns >= 2;
          return result;
        }

        // For classification, we need at least 2 columns selected (target class and at least one feature)
        if (problemType === ProblemTypes.Classification) {
          const result = numberOfSelectedColumns >= 2;
          return result;
        }

        // For survival, we need at least 3 columns selected (time, event indicator, and at least one feature)
        if (problemType === ProblemTypes.Survival) {
          const result = numberOfSelectedColumns >= 3;
          return result;
        }

        throw new Error('Wrong problem type');
      }),
    );
  }

  public getFileFormatValues(
    selectedData: any[],
    problemType: ProblemTypes,
    formValue: any,
    formValid: boolean,
    columnsWithErrors: string[],
    hasErrors: boolean,
  ): Observable<FileFormatValues> {
    return this.selectedColumns$.pipe(
      switchMap((selectedColumns) =>
        this.validateSelectedColumns(problemType).pipe(
          map((isValidSelection) => {
            const selectedColumnsConatainsErrors = columnsWithErrors.some((column) => selectedColumns.includes(column));
            const dataSource = selectedData.map((obj) => pick(obj, selectedColumns));
            const valid = formValid && isValidSelection && !selectedColumnsConatainsErrors;
            return { ...formValue, valid, dataSource, hasErrors };
          }),
        ),
      ),
    );
  }
}
