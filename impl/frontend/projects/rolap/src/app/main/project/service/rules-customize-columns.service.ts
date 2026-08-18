import { Injectable } from '@angular/core';

import { has, toArray } from 'lodash';

import { RuleTableUse, SubTabsNames } from '../../../common/store/app-state.model';
import { ProblemTypes } from '../../data-upload/utils/enums';
import { BaseCustomizeColumnsService } from './base-customize-columns.service';
import { Alignment, ColumnType, DataField, HeaderCellTemplate, Width } from './models/rules-customize-columns-api';

@Injectable({
  providedIn: 'root',
})
export class RulesCustomizeColumnsService extends BaseCustomizeColumnsService {
  //dodac train by y mean
  private defaultState = {
    [ProblemTypes.Classification]: {
      [SubTabsNames.RULES]: this.getClassificationRulesColumns(),
      [SubTabsNames.RULES_COVERAGE]: this.getClassificationRulesCoverageColumns(),
      [SubTabsNames.RULE_COMPARISON]: this.getClassificationRulesComparisonColumns(),
      [RuleTableUse.RULE_COMPARISON_SECOND_TABLE]: this.getClassificationRulesComparisonColumns(),
      [SubTabsNames.EXAMPLE]: this.getClassificationRulesExampleColumns(),
      [RuleTableUse.RULE_ADD_MODAL]: this.getClassificationRulesAddModal(),
    },
    [ProblemTypes.Regression]: {
      [SubTabsNames.RULES]: this.getRegressionRulesColumns(),
      [SubTabsNames.RULES_COVERAGE]: this.getRegressionRulesCoverageColumns(),
      [SubTabsNames.RULE_COMPARISON]: this.getRegressionRulesComparisonColumns(),
      [RuleTableUse.RULE_COMPARISON_SECOND_TABLE]: this.getRegressionRulesComparisonColumns(),
      [SubTabsNames.EXAMPLE]: this.getRegressionRulesExampleColumns(),
      [RuleTableUse.RULE_ADD_MODAL]: this.getRegressionRulesAddModal(),
    },
    [ProblemTypes.Survival]: {
      [SubTabsNames.RULES]: this.getSurvivalRulesColumns(),
      [SubTabsNames.RULES_COVERAGE]: this.getSurvivalRulesCoverageColumns(),
      [SubTabsNames.RULE_COMPARISON]: this.getSurvivalRulesComparisonColumns(),
      [RuleTableUse.RULE_COMPARISON_SECOND_TABLE]: this.getSurvivalRulesComparisonColumns(),
      [SubTabsNames.EXAMPLE]: this.getSurvivalRulesExampleColumns(),
      [RuleTableUse.RULE_ADD_MODAL]: this.getSurvivalRulesAddModal(),
    },
  };

  public customizeCol(
    col: any,
    problemType: ProblemTypes,
    subTabsNames:
      | SubTabsNames.RULES
      | SubTabsNames.RULES_COVERAGE
      | SubTabsNames.RULE_COMPARISON
      | SubTabsNames.EXAMPLE
      | RuleTableUse.RULE_ADD_MODAL
      | RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
    editRowFunction: (e: any) => any,
    calculateSortValueFunction?: (e: any) => any,
    moreButtonFunction?: (e: any) => any,
  ): void {
    const dataField = col.dataField as string;
    const defaultColumnsStates = this.defaultState[problemType][subTabsNames];
    if (!defaultColumnsStates || !has(defaultColumnsStates, dataField)) return;
    const defaultColumnState = (defaultColumnsStates as any)[dataField];

    if (!defaultColumnState) return;
    Object.keys(defaultColumnState).forEach((key) => {
      col[key] = defaultColumnState[key];
    });
    // Wymuszenie ukrycia kolumny yCoveredMedian niezależnie od danych
    if (col.dataField === 'yCoveredMedian' || col.dataField === DataField.YCoveredMedian) {
      col.visible = false;
      col.showInColumnChooser = false;
    }
    if (col.dataField === DataField.Uuid) {
      col.buttons = [
        {
          name: 'edit',
          onClick: editRowFunction,
          template: 'editButtonTemplate',
        },
        {
          name: 'delete',
          template: 'deleteButtonTemplate',
        },
        {
          name: 'more',
          template: 'moreButtonTemplate',
          onClick: moreButtonFunction,
        },
      ];
    }
    col.calculateSortValue = calculateSortValueFunction;
    //if column has no dataType, set it to string
    // all columns should have dataType to avoid W1005 https://js.devexpress.com/jQuery/Documentation/23_1/ApiReference/UI_Components/Errors_and_Warnings/#W1005
    col.dataType = col.dataType || 'string';

    if (col.dataType === 'number') {
      col.calculateFilterExpression = (filterValue: any, filterOperation: any) => {
        return function (cell: any) {
          const value = cell[col.dataField];

          // Parse the value, treating 'inf' as infinity
          const parseValue = (val: string): number => {
            return val === 'inf' ? Number.POSITIVE_INFINITY : parseFloat(val);
          };

          const numericValue = parseValue(value);

          // Check if the value is blank
          const isBlank = (val: string | number): boolean => {
            return val === null || val === undefined || val === '';
          };

          // Check if the value is between the specified range
          const isBetween = (val: number, range: [string, string]): boolean => {
            const [min, max] = range.map(parseValue);
            return val >= min && val <= max;
          };

          switch (filterOperation) {
            case 'isblank':
              return isBlank(value);
            case 'isnotblank':
              return !isBlank(value);
            case '=':
              return numericValue === parseValue(filterValue);
            case '<>':
              return numericValue !== parseValue(filterValue);
            case '<':
              return numericValue < parseValue(filterValue);
            case '>':
              return numericValue > parseValue(filterValue);
            case '<=':
              return numericValue <= parseValue(filterValue);
            case '>=':
              return numericValue >= parseValue(filterValue);
            case 'between':
              return isBetween(numericValue, filterValue);
            default:
              return false;
          }
        };
      };
    }
  }

  public getConfig(
    problemType: ProblemTypes,
    config:
      | SubTabsNames.RULES
      | SubTabsNames.RULES_COVERAGE
      | SubTabsNames.RULE_COMPARISON
      | SubTabsNames.EXAMPLE
      | RuleTableUse.RULE_ADD_MODAL
      | RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
  ) {
    return this.defaultState[problemType][config];
  }

  //get Header text based on dataField & displayType
  public getHeaderTextBasedOnDataField(
    dataField: DataField,
    displayType: SubTabsNames | RuleTableUse,
    problemType: ProblemTypes,
  ) {
    //uuid column is used as operations column
    if (dataField === DataField.Uuid) return 'operations';
    //displayString column is used as description
    if (dataField === DataField.DisplayString) return 'description';
    if (dataField === DataField.Visible) return 'showCoverage';
    //visibleFilter column is used as filterDataset
    if (dataField === DataField.VisibleFilter && displayType === SubTabsNames.RULES_COVERAGE) return 'filterDataset';
    //conclusion column in regression is used for boxplot column
    if (dataField === DataField.Conclusion && problemType === ProblemTypes.Regression) return 'boxplot';

    return dataField;
  }

  //Clasification rules columns
  private getClassificationRulesColumns() {
    return {
      ...this.defaultColumnsSettings,
      [DataField.Precision]: {
        ...this.defaultColumnsSettings[DataField.Precision],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 1,
      },
      [DataField.Coverage]: {
        ...this.defaultColumnsSettings[DataField.Coverage],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 2,
      },
      [DataField.P]: {
        ...this.defaultColumnsSettings[DataField.P],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.N]: {
        ...this.defaultColumnsSettings[DataField.N],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PUpperCase]: {
        ...this.defaultColumnsSettings[DataField.PUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.NUpperCase]: {
        ...this.defaultColumnsSettings[DataField.NUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.PValue]: {
        ...this.defaultColumnsSettings[DataField.PValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
      [DataField.Correlation]: {
        ...this.defaultColumnsSettings[DataField.Correlation],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 11,
      },
      [DataField.C2]: {
        ...this.defaultColumnsSettings[DataField.C2],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 12,
      },
      [DataField.RSS]: {
        ...this.defaultColumnsSettings[DataField.RSS],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 13,
      },
      [DataField.Lift]: {
        ...this.defaultColumnsSettings[DataField.Lift],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 14,
      },
      [DataField.NegativePredictiveValue]: {
        ...this.defaultColumnsSettings[DataField.NegativePredictiveValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 15,
      },
      [DataField.Sensitivity]: {
        ...this.defaultColumnsSettings[DataField.Sensitivity],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 16,
      },
      [DataField.Specificity]: {
        ...this.defaultColumnsSettings[DataField.Specificity],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 17,
      },
      [DataField.OddsRatio]: {
        ...this.defaultColumnsSettings[DataField.OddsRatio],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 18,
      },
      [DataField.RelativeRisk]: {
        ...this.defaultColumnsSettings[DataField.RelativeRisk],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 19,
      },
      [DataField.LRPlus]: {
        ...this.defaultColumnsSettings[DataField.LRPlus],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 20,
      },
      [DataField.LRMinus]: {
        ...this.defaultColumnsSettings[DataField.LRMinus],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 21,
      },
    };
  }

  private getClassificationRulesCoverageColumns() {
    return {
      ...this.defaultColumnsSettings,
      [DataField.AutoIncrement]: {
        ...this.defaultColumnsSettings[DataField.AutoIncrement],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.RuleName]: {
        ...this.defaultColumnsSettings[DataField.RuleName],
        visibleIndex: 0,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        visibleIndex: 1,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.RuleIndex]: {
        ...this.defaultColumnsSettings[DataField.RuleIndex],
        visible: false,
        showInColumnChooser: true,
      },
      [DataField.Labels]: {
        ...this.defaultColumnsSettings[DataField.Labels],
      },
      [DataField.LabelsText]: {
        ...this.defaultColumnsSettings[DataField.LabelsText],
        visibleIndex: 2,
      },
      [DataField.Active]: {
        ...this.defaultColumnsSettings[DataField.Active],
        visibleIndex: 3,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.VisibleFilter]: {
        ...this.defaultColumnsSettings[DataField.VisibleFilter],
        visibleIndex: 4,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Visible]: {
        ...this.defaultColumnsSettings[DataField.Visible],
        visibleIndex: 5,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.DisplayString]: {
        ...this.defaultColumnsSettings[DataField.DisplayString],
        visibleIndex: 6,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.DisplayConclusion]: {
        ...this.defaultColumnsSettings[DataField.DisplayConclusion],
        visibleIndex: 7,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Precision]: {
        ...this.defaultColumnsSettings[DataField.Precision],
        visibleIndex: 8,
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 1,
      },
      [DataField.Coverage]: {
        ...this.defaultColumnsSettings[DataField.Coverage],
        visibleIndex: 9,
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 2,
      },
      [DataField.P]: {
        ...this.defaultColumnsSettings[DataField.P],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.N]: {
        ...this.defaultColumnsSettings[DataField.N],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PUpperCase]: {
        ...this.defaultColumnsSettings[DataField.PUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.NUpperCase]: {
        ...this.defaultColumnsSettings[DataField.NUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.PValue]: {
        ...this.defaultColumnsSettings[DataField.PValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
      [DataField.Correlation]: {
        ...this.defaultColumnsSettings[DataField.Correlation],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 11,
      },
      [DataField.C2]: {
        ...this.defaultColumnsSettings[DataField.C2],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 12,
      },
      [DataField.RSS]: {
        ...this.defaultColumnsSettings[DataField.RSS],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 13,
      },
      [DataField.Lift]: {
        ...this.defaultColumnsSettings[DataField.Lift],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 14,
      },
      [DataField.NegativePredictiveValue]: {
        ...this.defaultColumnsSettings[DataField.NegativePredictiveValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 15,
      },
      [DataField.Sensitivity]: {
        ...this.defaultColumnsSettings[DataField.Sensitivity],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 16,
      },
      [DataField.Specificity]: {
        ...this.defaultColumnsSettings[DataField.Specificity],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 17,
      },
      [DataField.OddsRatio]: {
        ...this.defaultColumnsSettings[DataField.OddsRatio],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 18,
      },
      [DataField.RelativeRisk]: {
        ...this.defaultColumnsSettings[DataField.RelativeRisk],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 19,
      },
      [DataField.LRPlus]: {
        ...this.defaultColumnsSettings[DataField.LRPlus],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 20,
      },
      [DataField.LRMinus]: {
        ...this.defaultColumnsSettings[DataField.LRMinus],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 21,
      },
    };
  }

  private getClassificationRulesComparisonColumns() {
    // Kolejność i nazwy zgodnie z podaną listą
    return {
      ...this.defaultColumnsSettings,
      [DataField.Precision]: {
        ...this.defaultColumnsSettings[DataField.Precision],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 1,
      },
      [DataField.Coverage]: {
        ...this.defaultColumnsSettings[DataField.Coverage],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 2,
      },
      [DataField.P]: {
        ...this.defaultColumnsSettings[DataField.P],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.N]: {
        ...this.defaultColumnsSettings[DataField.N],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PUpperCase]: {
        ...this.defaultColumnsSettings[DataField.PUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.NUpperCase]: {
        ...this.defaultColumnsSettings[DataField.NUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.PValue]: {
        ...this.defaultColumnsSettings[DataField.PValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
      [DataField.Correlation]: {
        ...this.defaultColumnsSettings[DataField.Correlation],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 11,
      },
      [DataField.C2]: {
        ...this.defaultColumnsSettings[DataField.C2],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 12,
      },
      [DataField.RSS]: {
        ...this.defaultColumnsSettings[DataField.RSS],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 13,
      },
      [DataField.Lift]: {
        ...this.defaultColumnsSettings[DataField.Lift],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 14,
      },
      [DataField.NegativePredictiveValue]: {
        ...this.defaultColumnsSettings[DataField.NegativePredictiveValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 15,
      },
      [DataField.Sensitivity]: {
        ...this.defaultColumnsSettings[DataField.Sensitivity],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 16,
      },
      [DataField.Specificity]: {
        ...this.defaultColumnsSettings[DataField.Specificity],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 17,
      },
      [DataField.OddsRatio]: {
        ...this.defaultColumnsSettings[DataField.OddsRatio],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 18,
      },
      [DataField.RelativeRisk]: {
        ...this.defaultColumnsSettings[DataField.RelativeRisk],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 19,
      },
      [DataField.LRPlus]: {
        ...this.defaultColumnsSettings[DataField.LRPlus],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 20,
      },
      [DataField.LRMinus]: {
        ...this.defaultColumnsSettings[DataField.LRMinus],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 21,
      },
      // Pozostałe kolumny (operacje, compare, displayConclusion, active) - disabled w chooserze
      active: {
        ...this.defaultColumnsSettings.visibleFilter,
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        alignment: Alignment.Center,
        allowFiltering: true,
        allowHiding: false,
        allowEditing: true,
        dataField: null,
        headerCellTemplate: HeaderCellTemplate.Translate,
        name: null,
        type: ColumnType.Buttons,
        width: Width.Medium,
        visible: false,
        showInColumnChooser: false,
      },
      compare: {
        ...this.defaultColumnsSettings.compare,
        showInColumnChooser: false,
        visible: true,
      },
      displayConclusion: {
        ...this.defaultColumnsSettings.displayConclusion,
        visible: true,
        showInColumnChooser: false,
      },
    };
  }

  private getClassificationRulesAddModal() {
    return {
      ...this.defaultColumnsSettings,
      uuid: {
        ...this.defaultColumnsSettings.uuid,
        showInColumnChooser: false,
        visible: false,
      },
      active: {
        ...this.defaultColumnsSettings.active,
        showInColumnChooser: false,
        visible: false,
      },
      nUnique: { ...this.defaultColumnsSettings.nUnique, visible: false },
      pUnique: { ...this.defaultColumnsSettings.pUnique, visible: false },
      tp: { ...this.defaultColumnsSettings.tp, visible: false },
      tn: { ...this.defaultColumnsSettings.tn, visible: false },
      fp: { ...this.defaultColumnsSettings.fp, visible: false },
      fn: { ...this.defaultColumnsSettings.fn, visible: false },
      p: { ...this.defaultColumnsSettings.p, visible: false },
      n: { ...this.defaultColumnsSettings.n, visible: false },
      conclusion: { ...this.defaultColumnsSettings.conclusion, visible: false },
      [DataField.DisplayConclusion]: {
        ...this.defaultColumnsSettings[DataField.DisplayConclusion],
        visible: true,
        showInColumnChooser: true,
      },
    };
  }

  private getClassificationRulesExampleColumns() {
    return {
      ...this.defaultColumnsSettings,
      active: {
        ...this.defaultColumnsSettings.visibleFilter,
        visible: false,
        showInColumnChooser: false,
      },
      uuid: {
        ...this.defaultColumnsSettings.visible,
        visible: false,
        showInColumnChooser: false,
      },
      compare: {
        ...this.defaultColumnsSettings.compare,
        showInColumnChooser: false,
        visible: false,
      },
    };
  }

  private getRegressionRulesColumns() {
    return {
      ...this.getRegressionCommonColumns(),
      [DataField.YCoveredMedian]: {
        ...this.getRegressionCommonColumns()[DataField.YCoveredMedian],
        showInColumnChooser: false,
      },
    };
  }

  private getRegressionRulesExampleColumns() {
    return {
      ...this.getRegressionCommonColumns(),
      [DataField.DisplayString]: {
        ...this.getRegressionCommonColumns()[DataField.DisplayString],
        visibleIndex: 2,
      },
      [DataField.Active]: {
        ...this.getRegressionCommonColumns()[DataField.Active],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.Uuid]: {
        ...this.getRegressionCommonColumns()[DataField.Uuid],
        visible: false,
        showInColumnChooser: false,
      },
    };
  }

  private getRegressionRulesComparisonColumns() {
    return {
      ...this.getRegressionCommonColumns(),
      [DataField.AutoIncrement]: {
        ...this.getRegressionCommonColumns()[DataField.AutoIncrement],
        visibleIndex: 0, // Set AutoIncrement to appear first
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Labels]: {
        ...this.getRegressionCommonColumns()[DataField.Labels],
        visibleIndex: 1,
      },
      [DataField.LabelsText]: {
        ...this.getRegressionCommonColumns()[DataField.LabelsText],
        visibleIndex: 1, // Set Labels to appear second
      },
      [DataField.Compare]: {
        ...this.getRegressionCommonColumns()[DataField.Compare],
        visibleIndex: 2, // Set Compare to appear third
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.DisplayString]: {
        ...this.getRegressionCommonColumns()[DataField.DisplayString],
        visibleIndex: 3, // Set DisplayString to appear fourth
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.TrainCoveredYMean]: {
        ...this.getRegressionCommonColumns()[DataField.TrainCoveredYMean],
        visibleIndex: 4, // Set TrainCoveredYMean to appear sixth
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.Conclusion]: {
        ...this.getRegressionCommonColumns()[DataField.Conclusion],
        visibleIndex: 5,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.DisplayConclusion]: {
        ...this.getRegressionCommonColumns()[DataField.DisplayConclusion],
        visibleIndex: 4, // Set Conclusion to appear fifth
        visible: true,
        allowSorting: true,
        showInColumnChooser: true,
      },

      [DataField.MAE]: {
        ...this.getRegressionCommonColumns()[DataField.MAE],
        visibleIndex: 6, // Set MAE to appear seventh
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.RMSE]: {
        ...this.getRegressionCommonColumns()[DataField.RMSE],
        visibleIndex: 7, // Set RMSE to appear eighth
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        alignment: Alignment.Center,
        allowFiltering: true,
        allowHiding: false,
        allowEditing: true,
        dataField: null,
        headerCellTemplate: HeaderCellTemplate.Translate,
        name: null,
        type: ColumnType.Buttons,
        visibleIndex: 5,
        width: Width.Medium,
        visible: false,
        showInColumnChooser: false,
      },

      [DataField.Active]: {
        ...this.getRegressionCommonColumns()[DataField.Active],
        visible: false,
        showInColumnChooser: false,
      },
    };
  }

  private getRegressionRulesAddModal() {
    return {
      ...this.getRegressionRulesExampleColumns(),
      [DataField.AutoIncrement]: {
        ...this.defaultColumnsSettings[DataField.AutoIncrement],
        visible: false,
        showInColumnChooser: false,
      },
    };
  }

  private getRegressionCommonColumns() {
    return {
      ...this.defaultColumnsSettings,
      [DataField.Coverage]: {
        ...this.defaultColumnsSettings[DataField.Coverage],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 11,
      },
      [DataField.yCoveredAvg]: {
        ...this.defaultColumnsSettings[DataField.yCoveredAvg],
        visible: false,
        showInColumnChooser: false,
      },

      [DataField.DisplayConclusion]: {
        ...this.defaultColumnsSettings[DataField.DisplayConclusion],
        visibleIndex: 6,
        allowSorting: true,
        allowHiding: false,
        name: DataField.DisplayConclusion,
        visible: true,
        cellTemplate: 'regressionDisplayConclusionTemplate',
        dataType: 'number',
      },
      [DataField.Conclusion]: {
        alignment: Alignment.Center,
        allowFiltering: false,
        allowHiding: false,
        allowSorting: true,
        showInColumnChooser: true,
        visible: true,
        visibleIndex: 7,
        name: DataField.Conclusion,
        width: Width.Auto,
        cellTemplate: 'regressionRuleConclusionBoxplot',
        headerCellTemplate: 'translateTemplateHeader', //TODO should display box-plot in header text
      },
      [DataField.MAE]: {
        ...this.defaultColumnsSettings[DataField.MAE],
        visibleIndex: 8,
        allowHiding: true,
        visible: true,
        orderInColumnChooser: 1,
      },
      [DataField.RMSE]: {
        ...this.defaultColumnsSettings[DataField.RMSE],
        visibleIndex: 9,
        allowHiding: true,
        visible: true,
        orderInColumnChooser: 2,
      },
      [DataField.P]: {
        ...this.defaultColumnsSettings[DataField.P],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.N]: {
        ...this.defaultColumnsSettings[DataField.N],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PUpperCase]: {
        ...this.defaultColumnsSettings[DataField.PUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.NUpperCase]: {
        ...this.defaultColumnsSettings[DataField.NUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.PMinusvalue]: {
        ...this.defaultColumnsSettings[DataField.PMinusvalue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.Precision]: {
        ...this.defaultColumnsSettings[DataField.Precision],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 12,
      },
      [DataField.TrainCoveredYMean]: {
        ...this.defaultColumnsSettings[DataField.TrainCoveredYMean],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 13,
      },
      [DataField.TrainCoveredYStd]: {
        ...this.defaultColumnsSettings[DataField.TrainCoveredYStd],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 14,
      },
      [DataField.yCoveredMin]: {
        ...this.defaultColumnsSettings[DataField.yCoveredMin],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 15,
      },
      [DataField.yCoveredMax]: {
        ...this.defaultColumnsSettings[DataField.yCoveredMax],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 16,
      },
      [DataField.MAPE]: {
        ...this.defaultColumnsSettings[DataField.MAPE],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 17,
      },
    };
  }

  private getRegressionRulesCoverageColumns() {
    return {
      ...this.getRegressionCommonColumns(),
      [DataField.MAE]: {
        ...this.getRegressionCommonColumns()[DataField.MAE],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 1,
      },
      [DataField.RMSE]: {
        ...this.getRegressionCommonColumns()[DataField.RMSE],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 2,
      },
      [DataField.P]: {
        ...this.defaultColumnsSettings[DataField.P],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.N]: {
        ...this.defaultColumnsSettings[DataField.N],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PUpperCase]: {
        ...this.defaultColumnsSettings[DataField.PUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.NUpperCase]: {
        ...this.defaultColumnsSettings[DataField.NUpperCase],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.PMinusvalue]: {
        ...this.defaultColumnsSettings[DataField.PMinusvalue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.Precision]: {
        ...this.defaultColumnsSettings[DataField.Precision],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
      [DataField.Coverage]: {
        ...this.defaultColumnsSettings[DataField.Coverage],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 11,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 12,
      },

      [DataField.yCoveredMean]: {
        ...this.defaultColumnsSettings[DataField.yCoveredMean],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 14,
      },
      [DataField.yCoveredMin]: {
        ...this.defaultColumnsSettings[DataField.yCoveredMin],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 15,
      },
      [DataField.yCoveredMax]: {
        ...this.defaultColumnsSettings[DataField.yCoveredMax],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 16,
      },
      [DataField.MAPE]: {
        ...this.defaultColumnsSettings[DataField.MAPE],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 17,
      },
      [DataField.AutoIncrement]: {
        ...this.defaultColumnsSettings[DataField.AutoIncrement],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.RuleName]: {
        ...this.defaultColumnsSettings[DataField.RuleName],
        visibleIndex: 0,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Uuid]: {
        ...this.getRegressionCommonColumns()[DataField.Uuid],
        visibleIndex: 1,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Labels]: {
        ...this.getRegressionCommonColumns()[DataField.Labels],
        visibleIndex: 2,
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.LabelsText]: {
        ...this.getRegressionCommonColumns()[DataField.LabelsText],
        visibleIndex: 2,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Active]: {
        ...this.getRegressionCommonColumns()[DataField.Active],
        visibleIndex: 3,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.VisibleFilter]: {
        ...this.getRegressionCommonColumns()[DataField.VisibleFilter],
        visibleIndex: 4,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Visible]: {
        ...this.getRegressionCommonColumns()[DataField.Visible],
        visibleIndex: 5,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.ShowCoverage]: {
        ...this.getRegressionCommonColumns()[DataField.ShowCoverage],
        visibleIndex: 6,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.DisplayString]: {
        ...this.getRegressionCommonColumns()[DataField.DisplayString],
        visibleIndex: 6,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Conclusion]: {
        ...this.getRegressionCommonColumns()[DataField.Conclusion],
        visibleIndex: 8,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.TrainCoveredYMean]: {
        ...this.getRegressionCommonColumns()[DataField.TrainCoveredYMean],
        visibleIndex: 7,
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.DisplayConclusion]: {
        ...this.getRegressionCommonColumns()[DataField.DisplayConclusion],
        visibleIndex: 7,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.NumOfConditions]: {
        ...this.defaultColumnsSettings[DataField.NumOfConditions],
        visible: false,
        showInColumnChooser: true,
      },
      [DataField.RuleIndex]: {
        ...this.defaultColumnsSettings[DataField.RuleIndex],
        visible: false,
        showInColumnChooser: true,
      },
      yCoveredMedian: {
        ...this.defaultColumnsSettings[DataField.YCoveredMedian],
        visible: false,
        showInColumnChooser: false,
      },
    };
  }

  //Survival rules columns
  private getSurvivalRulesColumns() {
    return {
      ...this.getSurvivalDefaultColumns(),
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        visibleIndex: 2,
      },
    };
  }

  private getSurvivalRulesCoverageColumns() {
    return {
      ...this.defaultColumnsSettings,
      ...this.getSurvivalDefaultColumns(),
      [DataField.AutoIncrement]: {
        ...this.defaultColumnsSettings[DataField.AutoIncrement],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.RuleName]: {
        ...this.defaultColumnsSettings[DataField.RuleName],
        visibleIndex: 0,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        visibleIndex: 1,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Labels]: {
        ...this.defaultColumnsSettings[DataField.Labels],
        visibleIndex: 2,
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.LabelsText]: {
        ...this.defaultColumnsSettings[DataField.LabelsText],
        visibleIndex: 2,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Active]: {
        ...this.defaultColumnsSettings[DataField.Active],
        visibleIndex: 3,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.VisibleFilter]: {
        ...this.defaultColumnsSettings[DataField.VisibleFilter],
        visibleIndex: 4,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.Visible]: {
        ...this.defaultColumnsSettings[DataField.Visible],
        visibleIndex: 5,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.DisplayString]: {
        ...this.defaultColumnsSettings[DataField.DisplayString],
        visibleIndex: 6,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.KaplanMeierEstimator]: {
        ...this.defaultColumnsSettings[DataField.KaplanMeierEstimator],
        visibleIndex: 7,
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.MedianSurvivalTime]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTime],
        visibleIndex: 8,
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 1,
      },
      [DataField.Logrank]: {
        ...this.defaultColumnsSettings[DataField.Logrank],
        visibleIndex: 9,
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 2,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PValue]: {
        ...this.defaultColumnsSettings[DataField.PValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.EventsCount]: {
        ...this.defaultColumnsSettings[DataField.EventsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CensoredCount]: {
        ...this.defaultColumnsSettings[DataField.CensoredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.MedianSurvivalTimeCiLower]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTimeCiLower],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.MedianSurvivalTimeCiUpper]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTimeCiUpper],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
    };
  }

  private getSurvivalRulesComparisonColumns() {
    return {
      ...this.defaultColumnsSettings,
      ...this.getSurvivalDefaultColumns(),
      [DataField.Active]: {
        ...this.defaultColumnsSettings[DataField.Active],
        visible: false,
      },
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        alignment: Alignment.Center,
        allowFiltering: true,
        allowHiding: false,
        allowEditing: true,
        dataField: null,
        headerCellTemplate: HeaderCellTemplate.Translate,
        name: null,
        type: ColumnType.Buttons,
        width: Width.Medium,
        visible: false,
        showInColumnChooser: false,
        visibleIndex: 2,
      },
      [DataField.Compare]: {
        ...this.defaultColumnsSettings[DataField.Compare],
        visible: true,
        showInColumnChooser: true,
      },
      [DataField.MedianSurvivalTime]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTime],
        visibleIndex: 8,
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 1,
      },
      [DataField.Logrank]: {
        ...this.defaultColumnsSettings[DataField.Logrank],
        visibleIndex: 9,
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 2,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PValue]: {
        ...this.defaultColumnsSettings[DataField.PValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.EventsCount]: {
        ...this.defaultColumnsSettings[DataField.EventsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CensoredCount]: {
        ...this.defaultColumnsSettings[DataField.CensoredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.MedianSurvivalTimeCiLower]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTimeCiLower],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.MedianSurvivalTimeCiUpper]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTimeCiUpper],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
    };
  }

  private getSurvivalRulesExampleColumns() {
    return {
      ...this.defaultColumnsSettings,
      ...this.getSurvivalDefaultColumns(),
      [DataField.Active]: {
        ...this.defaultColumnsSettings[DataField.Active],
        visible: false,
      },
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        visible: false,
        showInColumnChooser: false,
      },
    };
  }

  private getSurvivalRulesAddModal() {
    return {
      ...this.defaultColumnsSettings,
      ...this.getSurvivalDefaultColumns(),
      [DataField.AutoIncrement]: {
        ...this.defaultColumnsSettings[DataField.AutoIncrement],
        visible: false,
        showInColumnChooser: false,
        allowHiding: true,
      },
      [DataField.Active]: {
        ...this.defaultColumnsSettings[DataField.Active],
        visible: false,
      },
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        visible: false,
      },
    };
  }

  private getSurvivalDefaultColumns() {
    return {
      ...this.defaultColumnsSettings,
      [DataField.Uuid]: {
        ...this.defaultColumnsSettings[DataField.Uuid],
        visibleIndex: 2,
        showInColumnChooser: true,
        visible: true,
      },
      [DataField.DisplayString]: {
        ...this.defaultColumnsSettings[DataField.DisplayString],
        visible: true,
        allowHiding: false,
        showInColumnChooser: true,
      },
      [DataField.Labels]: {
        ...this.defaultColumnsSettings[DataField.Labels],
      },
      [DataField.LabelsText]: {
        ...this.defaultColumnsSettings[DataField.LabelsText],
        visible: true,
        allowHiding: false,
        showInColumnChooser: true,
      },
      [DataField.Coverage]: {
        ...this.defaultColumnsSettings[DataField.Coverage],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.DisplayConclusion]: {
        ...this.defaultColumnsSettings[DataField.DisplayConclusion],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.KaplanMeierEstimator]: {
        ...this.defaultColumnsSettings[DataField.KaplanMeierEstimator],
        visible: true,
      },
      [DataField.LogRankStats]: {
        ...this.defaultColumnsSettings[DataField.LogRankStats],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 2,
      },
      [DataField.ConditionsCount]: {
        ...this.defaultColumnsSettings[DataField.ConditionsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 3,
      },
      [DataField.P]: {
        ...this.defaultColumnsSettings[DataField.P],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.N]: {
        ...this.defaultColumnsSettings[DataField.N],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.PUpperCase]: {
        ...this.defaultColumnsSettings[DataField.PUpperCase],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.NUpperCase]: {
        ...this.defaultColumnsSettings[DataField.NUpperCase],
        visible: false,
        showInColumnChooser: false,
      },
      [DataField.MedianSurvivalTime]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTime],
        visible: true,
        showInColumnChooser: true,
        orderInColumnChooser: 1,
      },
      [DataField.CoveredCount]: {
        ...this.defaultColumnsSettings[DataField.CoveredCount],
        showInColumnChooser: true,
        orderInColumnChooser: 4,
      },
      [DataField.PValue]: {
        ...this.defaultColumnsSettings[DataField.PValue],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 5,
      },
      [DataField.Support]: {
        ...this.defaultColumnsSettings[DataField.Support],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 6,
      },
      [DataField.EventsCount]: {
        ...this.defaultColumnsSettings[DataField.EventsCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 7,
      },
      [DataField.CensoredCount]: {
        ...this.defaultColumnsSettings[DataField.CensoredCount],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 8,
      },
      [DataField.MedianSurvivalTimeCiLower]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTimeCiLower],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 9,
      },
      [DataField.MedianSurvivalTimeCiUpper]: {
        ...this.defaultColumnsSettings[DataField.MedianSurvivalTimeCiUpper],
        visible: false,
        showInColumnChooser: true,
        orderInColumnChooser: 10,
      },
    };
  }

  /**
   * Retrieves the initial columns for the rules table based on the specified problem type.
   * Used in rulesets effects to set the initial state of the devExterme table in v2RulesTable.effects.
   *
   * @param problemType The type of the problem (Classification, Regression, or Survival).
   * @returns An array containing the initial columns for the rules table.
   * @throws Error if the problem type is not supported for setting initial columns state.
   */
  public getInitalColumns(problemType: ProblemTypes): any[] {
    if (problemType === ProblemTypes.Classification) {
      const columnsThatShouldBeVisible = [
        DataField.AutoIncrement,
        DataField.Uuid,
        DataField.LabelsText,
        DataField.Active,
        DataField.DisplayString,
        DataField.DisplayConclusion,
        DataField.Precision,
        DataField.Coverage,
      ];
      return this.getInitalColumnsBasedOnPreDefinedList(columnsThatShouldBeVisible, problemType);
    }
    if (problemType === ProblemTypes.Regression) {
      const columnsThatShouldBeVisible = [
        DataField.AutoIncrement,
        DataField.Uuid,
        DataField.LabelsText,
        DataField.Active,
        DataField.DisplayString,
        DataField.TrainCoveredYMean,
        DataField.DisplayConclusion,
        DataField.MAE,
        DataField.RMSE,
      ];

      return this.getInitalColumnsBasedOnPreDefinedList(columnsThatShouldBeVisible, problemType);
    }
    if (problemType === ProblemTypes.Survival) {
      const columnsThatShouldBeVisible = [
        DataField.AutoIncrement,
        DataField.Uuid,
        DataField.LabelsText,
        DataField.Active,
        DataField.DisplayString,
        DataField.KaplanMeierEstimator,
        DataField.MedianSurvivalTime,
        DataField.Logrank,
      ];

      return this.getInitalColumnsBasedOnPreDefinedList(columnsThatShouldBeVisible, problemType);
    }
    throw Error('Problem type not supported for setting inital columns state');
  }

  /**
   * Generate and return the state of a table for RULE ADD MODAL
   *
   * @param problemType
   */
  public getDefaultStateForRuleAddModal(problemType: ProblemTypes) {
    const config: any = this.getConfig(problemType, RuleTableUse.RULE_ADD_MODAL);
    const columnsThatShouldBeVisibleOnFirstLoad = [
      DataField.AutoIncrement,
      DataField.LabelsText,
      DataField.DisplayString,
      DataField.DisplayConclusion,
      DataField.Precision,
    ];
    if (problemType !== ProblemTypes.Regression) {
      columnsThatShouldBeVisibleOnFirstLoad.push(DataField.Coverage);
    }
    const columns = toArray(config).map((column: any) => {
      const dataField = column.dataField || column.name;
      const name = column.name;
      const visible = columnsThatShouldBeVisibleOnFirstLoad.includes(dataField);
      const visibleIndex = column.visibleIndex;
      return { dataField, name, visible, visibleIndex };
    });
    return { columns: columns };
  }

  /**
   * Generate and return the state of a table for SECOND COMPARISON TABLE
   *
   * @param problemType
   */
  public getColumnsForSecondRuleComparisonTable(problemType: ProblemTypes) {
    const config: any = this.getConfig(problemType, RuleTableUse.RULE_COMPARISON_SECOND_TABLE);
    const columnsThatShouldBeVisibleOnFirstLoad = [
      DataField.AutoIncrement,
      DataField.LabelsText,
      DataField.DisplayString,
      DataField.DisplayConclusion,
      DataField.Precision,
      DataField.Coverage,
    ];
    const columns = toArray(config).map((column: any) => {
      const dataField = column.dataField || column.name;
      const name = column.name;
      const visible = columnsThatShouldBeVisibleOnFirstLoad.includes(dataField);
      const visibleIndex = column.visibleIndex;
      return { dataField, name, visible, visibleIndex };
    });

    return { columns: columns };
  }

  public getColumnsForExampleSubTab(problemType: ProblemTypes) {
    const config: any = this.getConfig(problemType, RuleTableUse.RULE_COMPARISON_SECOND_TABLE);
    const columnsThatShouldBeVisibleOnFirstLoad = [
      DataField.AutoIncrement,
      DataField.LabelsText,
      DataField.DisplayString,
      DataField.DisplayConclusion,
      DataField.Precision,
      DataField.Coverage,
    ];
    const columns = toArray(config).map((column: any) => {
      const dataField = column.dataField || column.name;
      const name = column.name;
      const visible = columnsThatShouldBeVisibleOnFirstLoad.includes(dataField);
      const visibleIndex = column.visibleIndex;
      return { dataField, name, visible, visibleIndex };
    });

    return { columns: columns };
  }

  /**
   * Retrieves the initial columns based on a predefined list of column names.
   *
   * @param columnsThatShouldBeVisibleOnFirstLoad The list of column names that should be visible initially.
   * @returns An array containing the initial columns based on the predefined list.
   */
  private getInitalColumnsBasedOnPreDefinedList(
    columnsThatShouldBeVisibleOnFirstLoad: string[],
    problemType: ProblemTypes,
  ) {
    let columns: any;
    if (problemType === ProblemTypes.Classification) {
      columns = this.getClassificationRulesColumns();
    }
    if (problemType === ProblemTypes.Regression) {
      columns = this.getRegressionRulesColumns();
    }
    if (problemType === ProblemTypes.Survival) {
      columns = this.getSurvivalRulesColumns();
    }
    return toArray(columns).map((column: any) => {
      const dataField = column.dataField || column.name;
      const name = column.name;
      const visible = columnsThatShouldBeVisibleOnFirstLoad.includes(dataField);
      const visibleIndex = column.visibleIndex;
      const dataType = column.dataType;
      if (dataType) {
        return { dataField, name, visible, visibleIndex, dataType };
      } else {
        return { dataField, name, visible, visibleIndex };
      }
    });
  }

  public showNativeContextMenu(
    event: MouseEvent,
    rowData: Record<string, unknown>,
    dataGrid: any,
    tableInstanceService: any,
    contextMenuEnabled: boolean,
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (!contextMenuEnabled || !dataGrid) return;

    dataGrid.instance.selectRows([rowData['uuid']], false);
    tableInstanceService.setSelectedRowsUuids([rowData['uuid'] as string]);

    const rowIndex = dataGrid.instance.getRowIndexByKey(rowData['uuid']);
    if (rowIndex === -1) return;

    const rowElement = dataGrid.instance.getRowElement(rowIndex);
    if (!rowElement?.[0]) return;

    const syntheticEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: event.clientX,
      clientY: event.clientY,
      button: 2,
    });

    rowElement[0].dispatchEvent(syntheticEvent);
  }
}
