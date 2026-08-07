import { Injectable } from '@angular/core';

import { FilteredColumns } from '../../../common/components/data-grid/dataset-view-table/types';
import { SubTabsNames } from '../../../common/store/app-state.model';
import { ProblemTypes } from '../../data-upload/utils/enums';
import { BaseCustomizeColumnsService } from './base-customize-columns.service';
import { Alignment, DataField, Width } from './models/rules-customize-columns-api';

@Injectable({
  providedIn: 'root',
})
export class DatasetCustomizeColumnsService extends BaseCustomizeColumnsService {
  private specialColumn: FilteredColumns[] = [];

  public setSpecialColumns(columns: FilteredColumns[]) {
    this.specialColumn = columns;
  }

  public getSpecialColumns() {
    return this.specialColumn;
  }

  private defaultState = {
    [ProblemTypes.Classification]: {
      [SubTabsNames.DATASET]: this.getClassificationDatasetColumns(),
    },
    [ProblemTypes.Regression]: {
      [SubTabsNames.DATASET]: this.getRegressionDatasetColumns(),
    },
    [ProblemTypes.Survival]: {
      [SubTabsNames.DATASET]: this.getSurvivalDatasetColumns(),
    },
  };

  public getConfig(problemType: ProblemTypes, config: SubTabsNames.DATASET) {
    const specialColumns = this.getSpecialColumns();

    if (specialColumns) {
      const preparedSpecialColumns = this.prepareSpecialColumns(specialColumns);
      return {
        ...this.defaultState[problemType][config],
        ...preparedSpecialColumns,
      };
    } else {
      return this.defaultState[problemType][config];
    }
  }

  private getClassificationDatasetColumns() {
    return {
      ...this.defaultColumnsSettings,
      [DataField.RuleIndex]: {
        alignment: Alignment.Left,
        allowFiltering: false,
        allowHiding: true,
        allowSorting: false,
        name: DataField.RuleIndex,
        visibleIndex: 100,
        width: Width.Auto,
      },
    };
  }

  private getRegressionDatasetColumns() {
    return {
      ...this.defaultColumnsSettings,
    };
  }

  private getSurvivalDatasetColumns() {
    return {
      ...this.defaultColumnsSettings,
    };
  }

  prepareSpecialColumns(columns: FilteredColumns[]) {
    const specialColumnsConfig: { [key: string]: any } = {};
    columns.forEach((column) => {
      const columnKey = column.name;
      specialColumnsConfig[columnKey] = {
        alignment: Alignment.Left,
        allowFiltering: false,
        allowHiding: false,
        allowSorting: false,
        name: columnKey,
        visibleIndex: 100,
      };
    });

    return specialColumnsConfig;
  }
}
