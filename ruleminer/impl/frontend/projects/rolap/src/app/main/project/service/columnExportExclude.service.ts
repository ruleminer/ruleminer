import { Injectable } from '@angular/core';

import { ProblemTypes } from '../../data-upload/utils/enums';
import { DataField } from './models/rules-customize-columns-api';

@Injectable({
  providedIn: 'root',
})
export class ColumnExportExcludeService {
  public getExcludedColumns(problemType: ProblemTypes) {
    return this.excludedColumns[problemType];
  }

  private excludedColumns = {
    [ProblemTypes.Classification]: this.getClassificationDefaultColumnsToExclude(),
    [ProblemTypes.Regression]: this.getRegressionDefaultColumnsToExclude(),
    [ProblemTypes.Survival]: this.getSurvivalDefaultColumnsToExclude(),
  };

  private getClassificationDefaultColumnsToExclude() {
    return [];
  }

  private getRegressionDefaultColumnsToExclude() {
    return [DataField.DisplayConclusion];
  }

  private getSurvivalDefaultColumnsToExclude() {
    return [DataField.KaplanMeierEstimator];
  }
}
