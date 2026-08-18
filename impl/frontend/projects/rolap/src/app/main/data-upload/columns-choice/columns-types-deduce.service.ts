import { Injectable } from '@angular/core';

import { isEmpty as _isEmpty } from 'lodash';

import { ColumnTypes, ProblemTypes } from '../utils/enums';

export interface ColumnsTypesDeducingResult {
  columnsTypes: { [key: string]: string };
  specialColumnsNames: DeducedSpecialColumns;
}

interface DeducedSpecialColumns {
  label: string | null;
  survivalTime: string | null;
}

interface FileData {
  [columnName: string]: any;
}

class UnsupportedSpecialColumnTypeError extends Error {}

@Injectable({
  providedIn: 'root',
})
export class ColumnsTypesDeduceService {
  private LABEL_COLUMN_NAMES: { [problemType: string]: string[] } = {
    [ProblemTypes.Classification]: ['class', 'Class', 'CLASS', 'target', 'Target', 'TARGET', 'label', 'Label', 'LABEL'],
    [ProblemTypes.Regression]: ['class', 'Class', 'CLASS', 'target', 'Target', 'TARGET', 'label', 'Label', 'LABEL'],
    [ProblemTypes.Survival]: [
      'class',
      'target',
      'label',
      'survival_status',
      'Survival_Status',
      'Survival_status',
      'survival_Status',
      'survivalstatus',
      'Survivalstatus',
      'SurvivalStatus',
      'survived',
      'survivalStatus',
      'status',
      'event',
      'Event',
      'EVENT',
      'DEATH_EVENT',
      'death_event',
      'Death_Event',
      'Death_event',
      'death_Event',
    ],
  };
  private SURVIVAL_TIME_COLUMN_NAMES: string[] = [
    'survival_time',
    'Survival_time',
    'Survival_Time',
    'survival_Time',
    'survivaltime',
    'Survivaltime',
    'SurvivalTime',
    'survivalTime',
    'time',
  ];

  public deduceColumnsTypes(fileData: FileData[], problemType: ProblemTypes): ColumnsTypesDeducingResult | null {
    const data = this.prepareFileData(fileData);
    if (data === null) return null;

    const specialColumnsNames = this.deduceSpecialColumnsNames(fileData, problemType);
    const columnsTypes = this.checkColumnsTypes(data, problemType, specialColumnsNames);
    if (problemType === ProblemTypes.Survival) {
      this.fixSurvivalLabelColumnType(columnsTypes);
    }

    return { columnsTypes, specialColumnsNames };
  }

  private fixSurvivalLabelColumnType(columnsTypes: { [columnName: string]: string }) {
    const survivalLabels = this.LABEL_COLUMN_NAMES[ProblemTypes.Survival];

    // Survival labels are always categorical (even though they contain numerical 0 and 1 values)
    for (const label of survivalLabels) {
      if (columnsTypes[label]) {
        columnsTypes[label] = ColumnTypes.Cat;
      }
    }
  }

  checkIfColumnContainsValue(valueArray: string[], problemType: ProblemTypes) {
    const labelColumns = this.LABEL_COLUMN_NAMES[problemType];

    for (const value of valueArray) {
      if (labelColumns.includes(value)) {
        return value;
      }
    }
    return null;
  }

  checkIfColumnContainsSurvivalValue(valueArray: string[]) {
    const labelColumns = this.SURVIVAL_TIME_COLUMN_NAMES;
    for (const value of valueArray) {
      if (labelColumns.includes(value)) {
        return value;
      }
    }
    return null;
  }

  private checkColumnsTypes(
    data: FileData,
    problemType: ProblemTypes,
    deducedSpecialColumns: DeducedSpecialColumns,
  ): { [columnName: string]: string } {
    const deducedColumnsTypes: { [columnName: string]: string } = {};
    for (const columnName of Object.keys(data)) {
      const values: any[] = data[columnName];

      // check the label column type
      if (deducedSpecialColumns.label !== null && deducedSpecialColumns.label === columnName) {
        try {
          const labelColumnType: ColumnTypes = this.parseLabelColumnType(values, problemType);
          deducedColumnsTypes[columnName] = labelColumnType;
          continue;
        } catch (exception: unknown) {
          if (exception instanceof UnsupportedSpecialColumnTypeError) {
            deducedSpecialColumns.label = null;
          } else {
            throw exception;
          }
        }
      }

      // check the survival time column type
      if (deducedSpecialColumns.survivalTime !== null && deducedSpecialColumns.survivalTime === columnName) {
        try {
          const labelColumnType: ColumnTypes = this.parseSurvivalTimeColumnType(values);
          deducedColumnsTypes[columnName] = labelColumnType;
          continue;
        } catch (exception: unknown) {
          if (exception instanceof UnsupportedSpecialColumnTypeError) {
            deducedSpecialColumns.label = null;
          } else {
            throw exception;
          }
        }
      }
      if (this.tryParseNumber(values)) {
        deducedColumnsTypes[columnName] = ColumnTypes.Num;
        continue;
      }
      // by default type is string
      deducedColumnsTypes[columnName] = ColumnTypes.Cat;
    }
    return deducedColumnsTypes;
  }

  private parseLabelColumnType(columnValues: any[], problemType: ProblemTypes): ColumnTypes {
    const isProblemTypeSupported = [
      ProblemTypes.Regression,
      ProblemTypes.Survival,
      ProblemTypes.Classification,
    ].includes(problemType);

    if (!isProblemTypeSupported) throw new Error(`Unsupported problem type "${problemType}"`);

    if (problemType === ProblemTypes.Classification) return ColumnTypes.Cat; // treat as nominal column
    //Survival and regression problems
    if (this.tryParseNumber(columnValues)) return ColumnTypes.Num;
    // deduced label column type is not correct, deduced label is wrong
    throw new UnsupportedSpecialColumnTypeError('Expected label column to be either float or integer');
  }

  private parseSurvivalTimeColumnType(columnValues: any[]): ColumnTypes {
    if (this.tryParseNumber(columnValues)) return ColumnTypes.Num;
    throw new UnsupportedSpecialColumnTypeError('Expected survival time column to be either float or integer');
  }

  private deduceSpecialColumnsNames(fileData: FileData[], problemType: ProblemTypes): DeducedSpecialColumns {
    const deducedLabelColumn: string | null = this.deduceSpecialColumnName(
      fileData,
      this.LABEL_COLUMN_NAMES[problemType],
    );
    // For survival problem we need to deduce an additional survival time column
    const isSurvivalProblem = problemType === ProblemTypes.Survival;
    const survivalTime = isSurvivalProblem
      ? this.deduceSpecialColumnName(fileData, this.SURVIVAL_TIME_COLUMN_NAMES)
      : null;

    return {
      survivalTime,
      label: deducedLabelColumn,
    };
  }

  private deduceSpecialColumnName(fileData: FileData[], columnNamesToTry: string[]): string | null {
    if (_isEmpty(fileData)) return null;
    if (columnNamesToTry === undefined || columnNamesToTry === null) return null;

    // Initialize a map with keys as normalized column names and values as original column names
    const columnNames: Map<string, string> = new Map();
    Object.keys(fileData[0]).forEach((columnName: string) => {
      const normalizedColumnName = columnName.toLowerCase().trim().replace(' ', '_');
      columnNames.set(normalizedColumnName, columnName);
    });

    // Check each columnName to try against the map and return the first match found
    for (const columnNameToTry of columnNamesToTry) {
      const normalizedColumnNameToTry = columnNameToTry.toLowerCase().trim();
      const columnName: string | undefined = columnNames.get(normalizedColumnNameToTry);
      if (columnName !== undefined) {
        return columnName;
      }
    }

    // Return null if no match found
    return null;
  }

  private prepareFileData(fileData: FileData[]): FileData | null {
    if (_isEmpty(fileData)) return null;
    return this.buildFileData(fileData);
  }

  private buildFileData(fileData: FileData[]): FileData {
    const data: FileData = {};

    fileData.forEach((row: Record<string, any>) => {
      for (const columnName in row) {
        if (!Object.prototype.hasOwnProperty.call(data, columnName)) {
          data[columnName] = [];
        }
        data[columnName].push(row[columnName]);
      }
    });

    return data;
  }

  /**
   * This function checks if every value in the given array can be parsed as a number.
   * @param columnValues - Array of values to be check if they are numeric.
   * @returns {boolean} - Returns true if all values in the array are numeric, otherwise false.
   */
  private tryParseNumber(columnValues: any[]): boolean {
    columnValues = columnValues.filter((value) => value !== null && value !== undefined && value !== ''); // remove empty values
    if (_isEmpty(columnValues)) return false;
    return columnValues.every((value) => this.isNumeric(value));
  }

  /**
   * This function checks if the provided value can be interpreted as a finite number.
   *
   * @param   {any}   n - The value to check.
   * @returns {boolean} - Returns true if the value can be interpreted as a finite number, otherwise false.
   */
  private isNumeric = (n: any) => !isNaN(parseFloat(n)) && isFinite(n);
}
