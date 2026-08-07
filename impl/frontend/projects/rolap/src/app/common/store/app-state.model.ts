import { MappedItem } from '../../main/project/dataset/models/treeview';
import { TreeNode } from '../../main/project/dataset/treeview/types';
import { Project } from '../../main/project/models/project';
import { Process } from '../../main/project/process/models/process.model';
import { MainLimits } from '../../main/project/service/models/account.model';
import { AttributesState } from './attributes/attributes.reducer';
import { AuthState } from './auth/types';
import { BugReportState } from './bugReport/types';
import { IndicatorsMetaState } from './indicatorsMeta/types';
import { PredictionConfigOptionsState } from './predictionConfigOptions/types';
import { ProjectSearch } from './projectSearch/projectSearch.types';
import { TourState } from './tour/tour.reducer';
import { V2ClassifyState } from './v2Classify/v2Classify.reducer';
import { V2ComparisonState } from './v2Comparison/v2Comparison.reducer';
import { v2DataSetTableState } from './v2DataSetTable/v2DataSetTable.reducer';
import { V2DetailsOfRuleSetGenerationState } from './v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.reducer';
import { V2PredictionQualityTabState } from './v2PredictionQualityTab/v2PredictionQualityTab.reducer';
import { V2PredictionTabState } from './v2PredictionTab/v2PredictionTab.reducer';
import { V2RulesCoverageTabState } from './v2RulesCoverageTab/v2RulesCoverageTab.reducer';
import { V2RulesTableState } from './v2RulesTable/types';
import { V2StatisticsTabState } from './v2StatisticsTab/v2StatisticsTab.reducer';
import { V2TabStateInterface } from './v2Tabs/types';
import { V2VisualizationTabState } from './v2VisualizationTab/v2VisualizationTab.reducer';

export interface ConfusionMatrix {
  classes: string[];
  [className: string]: number[] | string[];
}

export interface GeneralIndicators {
  Balanced_accuracy?: number;
  F1_micro?: number;
  F1_macro?: number;
  F1_weighted?: number;
  G_mean_micro?: number;
  G_mean_macro?: number;
  G_mean_weighted?: number;
  Recall_micro?: number;
  Recall_macro?: number;
  Recall_weighted?: number;
  Specificity?: number;
  Confusion_matrix?: ConfusionMatrix;
}
export interface PredictionIndicator {
  TP: number;
  FP: number;
  TN: number;
  FN: number;
  Recall: number;
  Specificity: number;
  F1_score: number;
  G_mean: number;
  MCC: number;
  PPV: number;
  NPV: number;
  LR_plus: number;
  LR_minus: number;
  Odd_ratio: number;
  Relative_risk: number;
  Confusion_matrix: ConfusionMatrix;
  Covered_by_prediction: number;
  Not_covered_by_prediction: number;
}
export interface PredictionIndicators {
  [className: string]: PredictionIndicator;
}

export enum RefreshAllState {
  HIDDEN = 'hidden', // na gotowe zrobione zupdatowane
  CLICKABLE = 'clickable', //  wyswietlamy przycisk
  PROCESSING_DATA = 'processing_data', // to jak klikniemy i sie kreci
  SUCCESS = 'success', // i to jest zielony przycisk na 4 s
}

export type refreshAll = 'hidden' | 'clickable' | 'processing_data' | 'success';

export interface PredictionTab {
  refreshAll: refreshAll;
  trainingDataRefresh: boolean;
  testCard: {
    refresh: boolean;
    selectedDataSet: any;
    data: any;
  };
  predictionIndicators: PredictionIndicators;
}

export class PlotData {
  x: any[];
  y: any[];
  class: string;
  checked: boolean;
  orientation: string;
  data_type: string;
  type: string;
}

export interface HistogramTab {
  attribute_importance: PlotData[];
  condition_importance: PlotData[];
  maxAttributeElements: number;
  maxConditionElements: number;
  attribute_plot_type: boolean;
}

export interface Rule {
  index: number;
  premise: string;
  conclusion: string;
  precision: number;
  coverage: number;
}

export interface Validity {
  name: string;
  strength: number;
}

export interface RulesTab {
  refreshAll: refreshAll;
  predictionIndicators: {
    table: any;
    state: any;
    refresh: boolean;
    isLoading: boolean;
  };
  quantitativeCharacteristics: {
    table: any;
    state: any;
    refresh: boolean;
    isLoading: boolean;
  };
  importance: {
    refresh: boolean;
    conditionImportance: {
      table: any;
      state: any;
    };
    attributesImportance: {
      table: any;
      state: any;
    };
    isLoading: boolean;
  };
}

export enum SubTabsNames {
  RULES = 'rules',
  RULES_COVERAGE = 'rule_coverage',
  RULE_COMPARISON = 'rules_comparison',
  PREDICTION = 'prediction',
  PREDICTION_STATISTICS = 'prediction_statistics',
  VISUALISATION = 'visualization',
  EXAMPLE = 'example',
  DESCRIPTION = 'description',

  DATASET = 'dataset',
  STATISTICS = 'statistics',
  CHARTS = 'charts',
}

export enum RuleTableUse {
  RULE_ADD_MODAL = 'rule_add_modal',
  RULE_COMPARISON_SECOND_TABLE = 'RULE_COMPARISON_SECOND_TABLE',
}

export interface RuleSetData {
  rulesTab: RulesTab;
  predictionTab: PredictionTab;
  datasetTab: { statisticsTab: any };
  histogramTab: HistogramTab;
}

export type TabType = 'ruleSet' | 'dataSet' | 'report' | 'process' | 'compare';

export type RuleSetTab = {
  id: string;
  datasetText: string;
  data: RuleSetData;
};

export type DataSetTab = {
  id: string;
  data: any;
};

export type ReportTab = {
  id: string;
  data: any;
};

export type ProcessTab = {
  id: string;
  data?: any;
};

export type CompareTab = {
  id: string;
  data?: any;
};

export type Tabs = RuleSetTab | DataSetTab | ReportTab | ProcessTab | CompareTab;

export interface Sidebar {
  width: number;
  previous: number;
  isVisible: boolean;
}

export interface StoreVersion {
  version: number;
}

export interface AppState {
  version: StoreVersion;
  bugReport: BugReportState;
  auth: AuthState;
  limits: MainLimits | null;
  tabs: Tabs[];
  currentTab: Tabs | null;
  sidebar: Sidebar;
  processes: ProcessesState;
  labels: LabelsState;
  project: ProjectState;
  predictionConfigOptions: PredictionConfigOptionsState;
  v2CurrentTab: string;
  v2Tabs: V2TabStateInterface;
  v2Classify: V2ClassifyState;
  v2RulesTable: V2RulesTableState;
  v2PredictionQualityTab: V2PredictionQualityTabState;
  v2StatisticsTab: V2StatisticsTabState;
  v2DetailsOfRuleSetGeneration: V2DetailsOfRuleSetGenerationState;
  v2RulesCoverageTab: V2RulesCoverageTabState;
  v2ComparisonTab: V2ComparisonState;
  v2DataSetTable: v2DataSetTableState;
  v2VisualizationTab: V2VisualizationTabState;
  projectSearch: ProjectSearch;
  attributes: AttributesState;
  tour: TourState;
  indicatorsMeta: IndicatorsMetaState;
  v2PredictionTab: V2PredictionTabState;
}

export interface ProcessesState {
  activeProcesses: Process[];
}

export interface LabelsState {
  compacted: boolean;
}

export interface ProjectState {
  activeProject: Project;
  treeExpandedNodes: TreeNode[]

  treeDataRefreshTrigger: number;
  expandedNodesReadTrigger: number;

  treeData: MappedItem[] | null;
  isTreeDataLoading: boolean;
  treeDataError: any | null;
}
