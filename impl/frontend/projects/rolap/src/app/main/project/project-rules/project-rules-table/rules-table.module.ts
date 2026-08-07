import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxFormModule,
  DxListModule,
  DxNumberBoxModule,
  DxScrollViewModule,
} from 'devextreme-angular';
import { DxoColumnChooserModule } from 'devextreme-angular/ui/nested';
import { SelectColumnsBtnComponent } from 'projects/rolap/src/app/common/components/buttons/select-columns-btn/select-columns-btn.component';
import { CardModule } from 'projects/rolap/src/app/common/components/card/card.module';
import { StoreTableCheckBoxComponent } from 'projects/rolap/src/app/common/components/data-grid/store-table-check-box/store-table-check-box.component';
import { RefreshIconModule } from 'projects/rolap/src/app/common/components/icons/refresh-icon/refresh-icon.module';
import { LabelModule } from 'projects/rolap/src/app/common/components/label/label.module';
import { GetHeightForColumnChooserDirective } from 'projects/rolap/src/app/common/directives/get-height-for-column-chooser.directive';

import { CheckboxButtonComponent } from '../../../../common/components/buttons/checkbox-button/checkbox-button.component';
import { InfoComponent } from '../../../../common/components/info/info.component';
import { TooltipComponent } from '../../../../common/components/tooltip/tooltip.component';
import { UndoRedoButtonsComponent } from '../../../../common/components/undo-redo-buttons/undo-redo-buttons.component';
import { LogPipe } from '../../../../common/pipes/log.pipe';
import { ColoredCellBasedOnIdComponent } from '../../project-rules-coverage/colored-cell-based-on-id/colored-cell-based-on-id.component';
import { RegressionRuleHistogramComponent } from '../regression-rule-histogram/regression-rule-histogram.component';
import { RuleDeleteButtonComponent } from './buttons/rule-delete-button/rule-delete-button.component';
import { RulesTableAddRowButtonComponent } from './buttons/rules-table-add-row-button/rules-table-add-row-button.component';
import { RulesTableColumnChooserButtonComponent } from './buttons/rules-table-column-chooser-button/rules-table-column-chooser-button.component';
import { RulesTableExportButtonComponent } from './buttons/rules-table-export-button/rules-table-export-button.component';
import { RulesTableExportJsonButtonComponent } from './buttons/rules-table-export-json-button/rules-table-export-json-button.component';
import { RulesTableUndoRedoButtonsComponent } from './buttons/rules-table-undo-redo-buttons/rules-table-undo-redo-buttons.component';
import { SelectionClearButtonComponent } from './buttons/selection-clear-button/selection-clear-button.component';
import { RulesTableCoverageFilterToggleComponent } from './columns/cells/coverage-toggles/rules-table-coverage-filter-toggle/rules-table-coverage-filter-toggle.component';
import { RulesTableCoverageVisibilityToggleComponent } from './columns/cells/coverage-toggles/rules-table-coverage-visibility-toggle/rules-table-coverage-visibility-toggle.component';
import { RulesTableActivityToggleComponent } from './columns/cells/rules-table-active-toggle/rules-table-activity-toggle.component';
import { RulesTableComparisonCellComponent } from './columns/cells/rules-table-comparison-cell/rules-table-comparison-cell.component';
import { SurvivalRuleEstimatorCurveComponent } from './columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';
import { RulesTableActiveHeaderComponent } from './columns/headers/rules-table-active-header/rules-table-active-header.component';
import { RulesTableCoverageFilterHeaderComponent } from './columns/headers/rules-table-coverage-filter-header/rules-table-coverage-filter-header.component';
import { RulesTableCoverageVisibilityHeaderComponent } from './columns/headers/rules-table-coverage-visibility-header/rules-table-coverage-visibility-header.component';
import { RulesTableHeaderTextComponent } from './columns/headers/rules-table-header-text/rules-table-header-text.component';
import { NotCoveringRulesComponent } from './not-covering-rules/not-covering-rules.component';
import { RulesEditorMetricsComponent } from './project-rules-table-editor/rules-editor-metrics/rules-editor-metrics.component';
import { RuleConclusionEditorModule } from './project-rules-table-editor/rules-editor-side-column/rule-conclusion-editor/rule-conclusion-editor.module';
import { RulesEditorSideColumnComponent } from './project-rules-table-editor/rules-editor-side-column/rules-editor-side-column.component';
import { ProjectRulesTableSummaryComponent } from './project-rules-table-summary/project-rules-table-summary.component';
import { ProjectRulesTableComponent } from './project-rules-table.component';
import { RegressionRuleConclusionBoxplotModule } from './regression-rule-conclusion-boxplot/regression-rule-conclusion-boxplot.module';

@NgModule({
  declarations: [
    ProjectRulesTableComponent,
    RulesTableCoverageVisibilityToggleComponent,
    RulesTableCoverageFilterToggleComponent,
    RulesTableActivityToggleComponent,
    RuleDeleteButtonComponent,
    RulesTableAddRowButtonComponent,
    RulesTableCoverageVisibilityHeaderComponent,
    RulesTableCoverageFilterHeaderComponent,
    RulesTableActiveHeaderComponent,
    SelectionClearButtonComponent,
    RulesTableUndoRedoButtonsComponent,
    RulesTableComparisonCellComponent,
    RulesTableExportJsonButtonComponent,
    ProjectRulesTableSummaryComponent,
    RulesEditorSideColumnComponent,
  ],
  imports: [
    RulesTableExportButtonComponent,
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    DxDataGridModule,
    DxFormModule,
    DxListModule,
    DxScrollViewModule,
    DxNumberBoxModule,
    DxButtonModule,
    CardModule,
    DxCheckBoxModule,
    DxoColumnChooserModule,
    GetHeightForColumnChooserDirective,
    RegressionRuleConclusionBoxplotModule,
    SurvivalRuleEstimatorCurveComponent,
    StoreTableCheckBoxComponent,
    ColoredCellBasedOnIdComponent,
    RefreshIconModule,
    RegressionRuleHistogramComponent,
    SurvivalRuleEstimatorCurveComponent,
    LabelModule,
    TooltipComponent,
    CheckboxButtonComponent,
    LogPipe,
    InfoComponent,
    RulesEditorMetricsComponent,
    RuleConclusionEditorModule,
    SelectColumnsBtnComponent,
    RulesTableColumnChooserButtonComponent,
    RulesTableHeaderTextComponent,
    NotCoveringRulesComponent,
    UndoRedoButtonsComponent,
  ],
  exports: [ProjectRulesTableComponent, RulesEditorSideColumnComponent],
})
export class ProjectRulesTableModule {}
