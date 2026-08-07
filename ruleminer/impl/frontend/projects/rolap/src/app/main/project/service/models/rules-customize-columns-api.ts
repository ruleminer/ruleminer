import { DataType } from 'devextreme/ui/data_grid';

export type CustomizeColumnSettings = {
  dataField?: string;
  name: string;
  allowEditing?: boolean;
  allowSorting?: boolean;
  allowFiltering?: boolean;
  allowHiding?: boolean;
  dataType?: DataType;
  visible?: boolean;
  width?: string | number;
  minWidth?: string | number;
  visibleIndex?: number;
  alignment?: Alignment;
  cellTemplate?: CellTemplate;
  headerCellTemplate?: HeaderCellTemplate;
  columnType?: ColumnType;
  showInColumnChooser?: boolean;
  orderInColumnChooser?: number;
  calculateCellValue?: (data: any) => any;
  customizeText?: (data: any) => any;
  sortingMethod?: (value1: string, value2: string) => any;
  calculateSortValue?: (data: any) => any;
  calculateFilterExpression?: (filterValue: any, selectedFilterOperation: string) => any;
  buttons?: any;
  type?: ColumnType;
};

export enum Alignment {
  Left = 'left',
  Center = 'center',
}

export enum CellTemplate {
  Active = 'activityTemplate',
  AutoIncrement = 'autoIncrement',
  Compare = 'comparisonTemplate',
  Label = 'labelTemplate',
  SurvivalRuleConclusionCurve = 'survivalRuleConclusionCurve',
  Visibility = 'visibilityCell',
  VisibilityFilter = 'visibilityFilterCell',
  RuleName = 'ruleNameCell',
  BoxPlot = 'regressionRuleConclusionBoxplot',
}

export enum ButtonsTemplate {
  Delete = 'deleteButtonTemplate',
  Edit = 'editButtonTemplate',
}

export enum ButtonsName {
  Delete = 'delete',
  Edit = 'edit',
}

export enum HeaderCellTemplate {
  Active = 'activityTemplateHeader',
  Compare = 'comparisonTemplateHeader',
  Label = 'labelTemplateHeader',
  Visibility = 'visibilityCellHeader',
  VisibilityFilter = 'visibilityFilterCellHeader',
  Translate = 'translateTemplateHeader',
}

export enum DataField {
  CoveredCount = 'coveredCount',
  LogRankStats = 'logRankStats',
  RuleIndex = '#',
  RuleName = 'ruleName',
  Active = 'active',
  String = 'string',
  Selectable = 'selectable',
  Premise = 'premise',
  AutoIncrement = 'autoIncrement',
  VisibleFilter = 'visibleFilter',
  Visible = 'visible',
  Compare = 'compare',
  RuleUuid = 'ruleUuid',
  Uuid = 'uuid',
  Labels = 'labels',
  LabelsText = 'labelsText',
  DisplayString = 'displayString',
  Conclusion = 'conclusion',
  DisplayConclusion = 'displayConclusion',
  Precision = 'precision',
  Coverage = 'coverage',
  P = 'p',
  PValue = 'pValue',
  PMinusvalue = 'pMinusvalue',
  PUpperCase = 'pUpperCase',
  N = 'n',
  NUpperCase = 'nUpperCase',
  Sensitivity = 'sensitivity',
  RelativeRisk = 'relativeRisk',
  NegativePredictiveValue = 'negativePredictiveValue',
  C2 = 'c2',
  LRPlus = 'lrPlus',
  LRMinus = 'lrMinus',
  OddsRatio = 'oddsRatio',
  ShowCoverage = 'showCoverage',
  FilterDataset = 'filterDataset',
  Correlation = 'correlation',
  Lift = 'lift',
  RSS = 'rss',
  ConditionsCount = 'conditionsCount',
  NUnique = 'nUnique',
  NumOfConditions = 'numOfConditions',
  PValAdjusted = 'pValAdjusted',
  PUnique = 'pUnique',
  Name = 'name',
  Key = 'key',
  Value = 'value',
  ConditionName = 'conditionName',
  AttributeName = 'attributeName',
  Bacc = 'bacc',
  Importance = 'importance',
  Condition = 'condition',
  Recall = 'recall',
  Specificity = 'specificity',
  NumberOfRules = 'numberOfRules',
  AverageNumberOfConditions = 'averageNumberOfConditions',
  AveragePrecision = 'averagePrecision',
  AverageCoverage = 'averageCoverage',
  F1Macro = 'f1Macro',
  F1Micro = 'f1Micro',
  F1Weighted = 'f1Weighted',
  GMeanMacro = 'gMeanMacro',
  GMeanMicro = 'gMeanMicro',
  GMeanWeighted = 'gMeanWeighted',
  RecallMacro = 'recallMacro',
  RecallMicro = 'recallMicro',
  RecallWeighted = 'recallWeighted',
  BalancedAccuracy = 'balancedAccuracy',
  TP = 'tp',
  FP = 'fp',
  TN = 'tn',
  FN = 'fn',
  MCC = 'mCC',
  PPV = 'pPV',
  NPV = 'nPV',
  MAPE = 'mape',
  MAE = 'mae',
  RMSE = 'rmse',
  Support = 'support',
  TotalConditionsCount = 'totalConditionsCount',
  YCoveredMedian = 'yCoveredMedian',
  Logrank = 'logRank',
  CensoredCount = 'censoredCount',
  MedianSurvivalTime = 'medianSurvivalTime',
  MedianSurvivalTimeCiLower = 'medianSurvivalTimeCiLower',
  MedianSurvivalTimeCiUpper = 'medianSurvivalTimeCiUpper',
  KaplanMeierEstimator = 'kaplanMeierEstimator',
  yCoveredAvg = 'yCoveredAvg',
  yCoveredMax = 'yCoveredMax',
  yCoveredMean = 'yCoveredMean',
  yCoveredMin = 'yCoveredMin',
  TrainCoveredYMax = 'trainCoveredYMax',
  TrainCoveredYMean = 'trainCoveredYMean',
  TrainCoveredYMin = 'trainCoveredYMin',
  TrainCoveredYStd = 'trainCoveredYStd',
  EventsCount = 'eventsCount',
}

export enum Width {
  Auto = 'auto',
  SuperSmall = 70,
  Small = 100,
  SmallMedium = 120,
  Medium = 150,
  Large = 400,
}

export enum ColumnType {
  Buttons = 'buttons', // For buttons removes highlighting, Does not export to excel csv doesnt sort or filter
}
