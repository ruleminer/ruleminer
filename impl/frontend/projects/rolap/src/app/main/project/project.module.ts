import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxBoxModule,
  DxButtonModule,
  DxCheckBoxModule,
  DxContextMenuModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxListModule,
  DxLoadIndicatorModule,
  DxLoadPanelModule,
  DxNumberBoxModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTabsModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxTreeViewModule,
} from 'devextreme-angular';

import { IconsActionBarComponent } from '../../common/action-icons/components/icons-action-bar/icons-action-bar.component';
import { ExportDropdownComponent } from '../../common/components/buttons/export-dropdown/export-dropdown.component';
import { RefreshAllBtnComponent } from '../../common/components/buttons/refresh-all-btn/refresh-all-btn.component';
import { SelectColumnsBtnComponent } from '../../common/components/buttons/select-columns-btn/select-columns-btn.component';
import { SubTabButtonsComponent } from '../../common/components/buttons/sub-tab-buttons/sub-tab-buttons.component';
import { CardModule } from '../../common/components/card/card.module';
import { DatasetViewTableComponent } from '../../common/components/data-grid/dataset-view-table/dataset-view-table.component';
import { TranslatedKeyValueDataGridComponent } from '../../common/components/data-grid/translated-key-value-data-grid/translated-key-value-data-grid';
import { LogoComponent } from '../../common/components/icons/logo/logo.component';
import { TabTypeIconComponent } from '../../common/components/icons/tab-type-icon/tab-type-icon.component';
import { InfoComponent } from '../../common/components/info/info.component';
import { LabelModule } from '../../common/components/label/label.module';
import { LoaderComponent } from '../../common/components/loader/loader.component';
import { SidebarModule } from '../../common/components/sidebar/sidebar.module';
import { SummaryItemSpanComponent } from '../../common/components/summary-item-span/summary-item-span.component';
import { TextAreaComponent } from '../../common/components/text-area/text-area.component';
import { TitleComponent } from '../../common/components/title/title.component';
import { TooltipComponent } from '../../common/components/tooltip/tooltip.component';
import { ValidationMessageModule } from '../../common/components/validation-message/validation-message.module';
import { GetHeightForColumnChooserDirective } from '../../common/directives/get-height-for-column-chooser.directive';
import { LoadingDirective } from '../../common/directives/loading.directive';
import { RolapModalModule } from '../../common/modules/modal.module';
import { ExecutionTimeModule } from '../../common/pipes/execution-time/execution-time.module';
import { LogPipe } from '../../common/pipes/log.pipe';
import { SafePipe } from '../../common/pipes/safe.pipe';
import { RolapCloseIconComponent } from '../../common/rolap-close-icon/rolap-close-icon.component';
import { CompareDetailViewComponent } from './compare/compare-detail-view/compare-detail-view.component';
import { CompareParamsComponent } from './compare/compare-params/compare-params.component';
import { CompareTableComponent } from './compare/compare-table/compare-table.component';
import { CompareComponent } from './compare/compare.component';
import { KnowledgeDiscoveryComponent } from './compare/knowledge-discovery/knowledge-discovery.component';
import { PredictiveCapacilitiesTableComponent } from './compare/predictive-capacilities-table/predictive-capacilities-table.component';
import { PredictiveCapacitiesComponent } from './compare/predictive-capacities/predictive-capacities.component';
import { DatasetBarChartComponent } from './dataset-charts/dataset-bar-chart/dataset-bar-chart.component';
import { DatasetChartsComponent } from './dataset-charts/dataset-charts.component';
import { DatasetCorrelationModule } from './dataset-charts/dataset-correlation/dataset-correlation.module';
import { DatasetHistogramChartComponent } from './dataset-charts/dataset-histogram-chart/dataset-histogram-chart.component';
import { KaplanMeierChartComponent } from './dataset-charts/kaplan-meier-chart/kaplan-meier-chart.component';
import { DatasetNominalTableComponent } from './dataset-statistics/dataset-nominal-table/dataset-nominal-table/dataset-nominal-table.component';
import { DatasetNumericalTableComponent } from './dataset-statistics/dataset-numerical-table/dataset-numerical-table/dataset-numerical-table.component';
import { DatasetStatisticsComponent } from './dataset-statistics/dataset-statistics.component';
import { DatasetDescriptionFormComponent } from './dataset-statistics/dataset-summary-table/dataset-description-form/dataset-description-form/dataset-description-form.component';
import { DatasetSummaryTableComponent } from './dataset-statistics/dataset-summary-table/dataset-summary-table.component';
import { DatasetViewModalComponent } from './dataset-view/dataset-view-modal/dataset-view-modal/dataset-view-modal.component';
import { DatasetViewComponent } from './dataset-view/dataset-view.component';
import { RulesetSelectModalComponent } from './dataset-view/ruleset-select-modal/ruleset-select-modal/ruleset-select-modal.component';
import { ProcessAbortButtonComponent } from './process/process-abort-button/process-abort-button.component';
import { ProcessDataSetComponent } from './process/process-data-set/process-data-set.component';
import { ProcessDetailViewComponent } from './process/process-detail-view/process-detail-view.component';
import { ProcessDetailsComponent } from './process/process-detail-view/process-details/process-details.component';
import { ProcessHistoryItemComponent } from './process/process-detail-view/process-history/process-history-item.component';
import { ProcessInfoTableComponent } from './process/process-detail-view/process-info-table/process-info-table.component';
import { ProcessHistoryComponent } from './process/process-history/process-history.component';
import { ProcessParamsComponent } from './process/process-params/process-params.component';
import { ProcessRefreshBtnComponent } from './process/process-refresh-btn/process-refresh-btn.component';
import { ProcessStatusComponent } from './process/process-status/process-status.component';
import { ProcessTabInfoComponent } from './process/process-tab-info/process-tab-info.component';
import { ProcessTableComponent } from './process/process-table/process-table.component';
import { ProcessTypeComponent } from './process/process-type/process-type.component';
import { ProcessComponent } from './process/process.component';
import { ProjectEffectComponent } from './process/project-effect/project-effect.component';
import { ProjectAddEditComponent } from './project-add-edit/project-add-edit.component';
import { ProjectDescriptionFormComponent } from './project-description/project-description-form/project-description-form.component';
import { ProjectDescriptionComponent } from './project-description/project-description.component';
import { RulesetGenerationExpertInductionComponent } from './project-description/ruleset-generation-expert-induction/ruleset-generation-expert-induction.component';
import { RulesetGenerationParametersComponent } from './project-description/ruleset-generation-parameters/ruleset-generation-parameters.component';
import { RulesetGenerationPreditionConfigTableComponent } from './project-description/ruleset-generation-predition-config-table/ruleset-generation-predition-config-table.component';
import { RulesetPredictionConfigurationComponent } from './project-description/ruleset-prediction-configuration/ruleset-prediction-configuration.component';
import { CurrentCompareComponent } from './project-details/display-currently-selected-tab/current-compare/current-compare.component';
import { CurrentDatasetComponent } from './project-details/display-currently-selected-tab/current-dataset/current-dataset.component';
import { CurrentProcessComponent } from './project-details/display-currently-selected-tab/current-process/current-process.component';
import { CurrentReportComponent } from './project-details/display-currently-selected-tab/current-report/current-report.component';
import { CurrentRulesetComponent } from './project-details/display-currently-selected-tab/current-ruleset/current-ruleset.component';
import { DisplayCurrentlySelectedTabComponent } from './project-details/display-currently-selected-tab/display-currently-selected-tab.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { AppBarTruncatePipe } from './project-details/tab-bar/pipe/app-bar-truncate.pipe';
import { TabBarItemComponent } from './project-details/tab-bar/tab-bar-item/tab-bar-item.component';
import { TabBarComponent } from './project-details/tab-bar/tab-bar.component';
import { AddCardButtonComponent } from './project-example/add-card-button/add-card-button.component';
import { ClassifyCardCloseBtnComponent } from './project-example/project-example-item/classify-card-close-btn/classify-card-close-btn.component';
import { ProjectExampleItemRecalculateBtnComponent } from './project-example/project-example-item/project-example-item-recalculate-btn/project-example-item-recalculate-btn.component';
import { ProjectExampleItemSelectBtnComponent } from './project-example/project-example-item/project-example-item-select-btn/project-example-item-select-btn.component';
import { ProjectExampleItemComponent } from './project-example/project-example-item/project-example-item.component';
import { ProjectExampleResultsComponent } from './project-example/project-example-results/project-example-results.component';
import { ProjectExampleSelectModalComponent } from './project-example/project-example-select-modal/project-example-select-modal.component';
import { ProjectExampleComponent } from './project-example/project-example.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectPredictionResultModule } from './project-prediction-result/project-prediction-result.module';
import { ProjectPredictionModule } from './project-prediction/project-prediction.module';
import { ProjectRoutingModule } from './project-routing.module';
import { CoveragePredictionColumnCellComponent } from './project-rules-coverage/coverage-prediction-column-cell/coverage-prediction-column-cell.component';
import { ProjectRulesCoverageModule } from './project-rules-coverage/project-rules-coverage.module';
import { RuleTableSaveButtonComponent } from './project-rules/project-rules-table/buttons/rule-table-save-button/rule-table-save-button.component';
import { RulesTableColumnChooserButtonComponent } from './project-rules/project-rules-table/buttons/rules-table-column-chooser-button/rules-table-column-chooser-button.component';
import { ProjectRulesTableModule } from './project-rules/project-rules-table/rules-table.module';
import { ProjectRulesModule } from './project-rules/project-rules.module';
import { ProjectRulesetComparisonModule } from './project-ruleset-comparison/project-ruleset-comparison.module';
import { DeleteProjectConfirmComponent } from './project-tile/delete-project-confirm/delete-project-confirm.component';
import { ProjectTileComponent } from './project-tile/project-tile.component';
import { ProjectTypeLabelComponent } from './project-tile/project-type-label/project-type-label.component';
import { ProjectVisualizationModule } from './project-visualization/project-visualization.module';
import { ProjectComponent } from './project.component';
import { ProjectCreateComponent } from './recent-project/project-create/project-create.component';
import { RecentProjectComponent } from './recent-project/recent-project.component';
import { SearchFilterComponent } from './recent-project/search-filter/search-filter.component';
import { SortHeaderComponent } from './recent-project/sort-header/sort-header.component';
import { ReportComponent } from './report/report.component';
import { SampleProjectComponent } from './sample-project/sample-project.component';

@NgModule({
  declarations: [
    ProjectComponent,
    ProjectListComponent,
    ProjectTileComponent,
    ProjectAddEditComponent,
    ProjectDetailsComponent,
    TabBarComponent,
    TabBarItemComponent,
    DisplayCurrentlySelectedTabComponent,
    DatasetStatisticsComponent,
    DatasetViewComponent,
    ProjectExampleComponent,
    ProjectExampleSelectModalComponent,
    ProjectExampleResultsComponent,
    DatasetViewModalComponent,
    DatasetChartsComponent,
    DatasetNumericalTableComponent,
    DatasetNominalTableComponent,
    ProjectDescriptionComponent,
    ProjectDescriptionFormComponent,
    RulesetGenerationParametersComponent,
    ProjectExampleItemComponent,
    RulesetSelectModalComponent,
    CurrentRulesetComponent,
    RuleTableSaveButtonComponent,
    CurrentDatasetComponent,
    CurrentReportComponent,
    ReportComponent,
    SafePipe,
    ProjectExampleItemSelectBtnComponent,
    ProjectExampleItemRecalculateBtnComponent,
    DatasetSummaryTableComponent,
    AppBarTruncatePipe,
    DatasetDescriptionFormComponent,
    DeleteProjectConfirmComponent,
    ProcessComponent,
    ProcessTableComponent,
    ProcessAbortButtonComponent,
    CurrentProcessComponent,
    ProcessStatusComponent,
    ProcessTypeComponent,
    ProcessDetailViewComponent,
    ProcessParamsComponent,
    ProcessHistoryComponent,
    ProcessDataSetComponent,
    ProjectEffectComponent,
    ProcessRefreshBtnComponent,
    CurrentCompareComponent,
    CompareComponent,
    KnowledgeDiscoveryComponent,
    PredictiveCapacitiesComponent,
    CompareTableComponent,
    CompareDetailViewComponent,
    PredictiveCapacilitiesTableComponent,
    CompareParamsComponent,
    ProjectTypeLabelComponent,
    SampleProjectComponent,
    RecentProjectComponent,
    SearchFilterComponent,
    SortHeaderComponent,
    ProjectCreateComponent,
    RulesetGenerationPreditionConfigTableComponent,
    KaplanMeierChartComponent,
    RulesetGenerationExpertInductionComponent,
    ProcessInfoTableComponent,
    ProcessDetailsComponent,
    ProcessHistoryComponent,
    ProcessHistoryItemComponent,
  ],
  imports: [
    CommonModule,
    ProjectVisualizationModule,
    ProjectRoutingModule,
    ProjectRulesetComparisonModule,
    ReactiveFormsModule,
    DxTextBoxModule,
    DxBoxModule,
    DxNumberBoxModule,
    DxListModule,
    DxCheckBoxModule,
    FormsModule,
    DxRadioGroupModule,
    DxButtonModule,
    DxRadioGroupModule,
    DxFormModule,
    DxScrollViewModule,
    DxTextAreaModule,
    DxPopupModule,
    DxButtonModule,
    DxTabsModule,
    TranslateModule,
    DxContextMenuModule,
    RolapModalModule,
    TitleComponent,
    DxSelectBoxModule,
    ProjectRulesModule,
    ProjectPredictionModule,
    ProjectPredictionResultModule,
    CardModule,
    DxDataGridModule,
    DxDateBoxModule,
    ProjectRulesCoverageModule,
    SidebarModule,
    FontAwesomeModule,
    RefreshAllBtnComponent,
    DxLoadIndicatorModule,
    GetHeightForColumnChooserDirective,
    ValidationMessageModule,
    TranslatedKeyValueDataGridComponent,
    DatasetViewTableComponent,
    LogoComponent,
    LabelModule,
    ProjectRulesTableModule,
    DxTooltipModule,
    DxTextBoxModule,
    ExecutionTimeModule,
    DatasetCorrelationModule,
    DatasetHistogramChartComponent,
    DatasetBarChartComponent,
    CoveragePredictionColumnCellComponent,
    DxTagBoxModule,
    InfoComponent,
    DxDropDownBoxModule,
    DxTreeViewModule,
    TooltipComponent,
    SubTabButtonsComponent,
    LoaderComponent,
    LoadingDirective,
    RulesetPredictionConfigurationComponent,
    LoadingDirective,
    SummaryItemSpanComponent,
    LogPipe,
    InfoComponent,
    DxLoadPanelModule,
    ClassifyCardCloseBtnComponent,
    TabTypeIconComponent,
    ExportDropdownComponent,
    SelectColumnsBtnComponent,
    RulesTableColumnChooserButtonComponent,
    IconsActionBarComponent,
    ProcessTabInfoComponent,
    AddCardButtonComponent,
    TextAreaComponent,
    RolapCloseIconComponent,
  ],
  exports: [ProjectComponent, ProjectAddEditComponent, ProjectListComponent, ProjectTileComponent],
})
export class ProjectModule {}
