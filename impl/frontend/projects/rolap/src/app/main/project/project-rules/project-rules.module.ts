import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxAccordionModule,
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxDropDownBoxModule,
  DxFilterBuilderModule,
  DxFormModule,
  DxListModule,
  DxLoadIndicatorModule,
  DxNumberBoxModule,
  DxPopoverModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxSwitchModule,
  DxTagBoxModule,
  DxTextBoxModule,
  DxTreeViewModule,
} from 'devextreme-angular';
import { DxiItemModule, DxoSearchPanelModule } from 'devextreme-angular/ui/nested';

import { ExportDropdownComponent } from '../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { CardModule } from '../../../common/components/card/card.module';
import { StoreTableCheckBoxComponent } from '../../../common/components/data-grid/store-table-check-box/store-table-check-box.component';
import { RefreshIconModule } from '../../../common/components/icons/refresh-icon/refresh-icon.module';
import { VisibilityToggleIconComponent } from '../../../common/components/icons/visibility-toggle-icon.component';
import { InfoComponent } from '../../../common/components/info/info.component';
import { LoaderComponent } from '../../../common/components/loader/loader.component';
import { StepperModule } from '../../../common/components/stepper/stepper.module';
import { TooltipComponent } from '../../../common/components/tooltip/tooltip.component';
import { ValidationMessageModule } from '../../../common/components/validation-message/validation-message.module';
import { ValueChangeArrowComponent } from '../../../common/components/value-change-arrow/value-change-arrow.component';
import { CollapseDirective } from '../../../common/directives/collapse.directive';
import { GetHeightForColumnChooserDirective } from '../../../common/directives/get-height-for-column-chooser.directive';
import { LoadingDirective } from '../../../common/directives/loading.directive';
import { LogPipe } from '../../../common/pipes/log.pipe';
import { RulesetPredictionConfigurationComponent } from '../project-description/ruleset-prediction-configuration/ruleset-prediction-configuration.component';
import { AddRulesetModalModule } from './modals/add-ruleset-modal/add-ruleset-modal.module';
import { ImportRulesetModalModule } from './modals/import-ruleset-modal/import-ruleset-modal.module';
import { AlgorithmConfigurationComponent } from './modals/project-generate-rule-set-modal/algorithm-configuration/algorithm-configuration.component';
import { AlgorithmParameterComponent } from './modals/project-generate-rule-set-modal/algorithm-parameter/algorithm-parameter.component';
import { ExpertForbiddenAttributeSelectModalComponent } from './modals/project-generate-rule-set-modal/expert-induction/expert-attribute/expert-forbidden-attribute-select-modal/expert-forbidden-attribute-select-modal.component';
import { ExpertPreferredAttributeSelectModalComponent } from './modals/project-generate-rule-set-modal/expert-induction/expert-attribute/expert-preferred-attribute-select-modal/expert-preferred-attribute-select-modal.component';
import { ExpertInductionComponent } from './modals/project-generate-rule-set-modal/expert-induction/expert-induction.component';
import { ExpertParameterDisplayComponent } from './modals/project-generate-rule-set-modal/expert-induction/expert-parameter-display/expert-parameter-display.component';
import { ManualRuleGeneratorComponent } from './modals/project-generate-rule-set-modal/manual-rule-generator/manual-rule-generator.component';
import { ManualSelectRuleDatasetSelectorComponent } from './modals/project-generate-rule-set-modal/manual-rule-generator/manual-select-rule/manual-select-rule/manual-select-rule-dataset-selector/manual-select-rule-dataset-selector.component';
import { ManualSelectRuleComponent } from './modals/project-generate-rule-set-modal/manual-rule-generator/manual-select-rule/manual-select-rule/manual-select-rule.component';
import { ManualRulesetGeneratorComponent } from './modals/project-generate-rule-set-modal/manual-ruleset-generator/manual-ruleset-generator.component';
import { ProjectAlgorithmChooserModalComponent } from './modals/project-generate-rule-set-modal/project-algorithm-chooser-modal/project-algorithm-chooser-modal.component';
import { ProjectGenerateRuleSetModalComponent } from './modals/project-generate-rule-set-modal/project-generate-rule-set-modal.component';
import { RulesetGenerationNameComponent } from './modals/project-generate-rule-set-modal/ruleset-generation-name/ruleset-generation-name.component';
import { SimpleRulesGeneratorComponent } from './modals/project-generate-rule-set-modal/simple-rules-generator/simple-rules-generator.component';
import { TreeComponent } from './modals/project-generate-rule-set-modal/tree/tree.component';
import { ProjectRulesImportanceCardComponent } from './project-rules-importance-card/project-rules-importance-card.component';
import { ProjectRulesImportanceTableComponent } from './project-rules-importance-card/project-rules-importance-table/project-rules-importance-table.component';
import { ProjectRulesPredictionIndicatorsCardComponent } from './project-rules-prediction-indicators-card/project-rules-prediction-indicators-card.component';
import { ProjectRulesQuantitativeCharacteristicsCardComponent } from './project-rules-quantitative-characteristics-card/project-rules-quantitative-characteristics-card.component';
import { ProjectSaveRulesTableModalComponent } from './project-rules-table/buttons/rule-table-save-button/project-save-rules-table-modal/project-save-rules-table-modal.component';
import { ProjectRulesTableEditorComponent } from './project-rules-table/project-rules-table-editor/project-rules-table-editor.component';
import { ProjectRulesTableFooterComponent } from './project-rules-table/project-rules-table-editor/project-rules-table-footer/project-rules-table-footer.component';
import { RuleEditorUndoRedoButtonsComponent } from './project-rules-table/project-rules-table-editor/project-rules-table-footer/rule-editor-undo-redo-buttons/rule-editor-undo-redo-buttons.component';
import { RulesEditorMetricsComponent } from './project-rules-table/project-rules-table-editor/rules-editor-metrics/rules-editor-metrics.component';
import { ProjectRulesTableModule } from './project-rules-table/rules-table.module';
import { ProjectRulesComponent } from './project-rules.component';
import { RulesRoutingModule } from './rules-routing.module';
import { FilterBuilderContainerComponent } from '../../../common/filter-builder/components/filter-builder-container/filter-builder-container.component';

@NgModule({
  declarations: [
    ProjectRulesComponent,
    ProjectGenerateRuleSetModalComponent,
    ProjectAlgorithmChooserModalComponent,
    ProjectRulesTableEditorComponent,
    RuleEditorUndoRedoButtonsComponent,
    ProjectRulesPredictionIndicatorsCardComponent,
    ProjectRulesQuantitativeCharacteristicsCardComponent,
    ProjectRulesImportanceCardComponent,
    TreeComponent,
    SimpleRulesGeneratorComponent,
    ProjectSaveRulesTableModalComponent,
    ManualRuleGeneratorComponent,
    ManualSelectRuleComponent,
    ProjectRulesImportanceTableComponent,
    ExpertInductionComponent,
    AlgorithmParameterComponent,
    ExpertPreferredAttributeSelectModalComponent,
    ExpertForbiddenAttributeSelectModalComponent,
    ExpertParameterDisplayComponent,
    ManualSelectRuleDatasetSelectorComponent,
    ProjectRulesTableFooterComponent,
    AlgorithmConfigurationComponent,
    RulesetGenerationNameComponent,
    ManualRulesetGeneratorComponent,
  ],
  exports: [ProjectGenerateRuleSetModalComponent, ProjectRulesComponent],
  imports: [
    FilterBuilderContainerComponent,
    CommonModule,
    RulesRoutingModule,
    DxDataGridModule,
    CardModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DxFormModule,
    DxSelectBoxModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxCheckBoxModule,
    DxNumberBoxModule,
    DxoSearchPanelModule,
    DxCheckBoxModule,
    DxButtonModule,
    DxPopupModule,
    DxTagBoxModule,
    DxPopoverModule,
    DxScrollViewModule,
    DxTreeViewModule,
    DxiItemModule,
    DxFilterBuilderModule,
    StepperModule,
    DxRadioGroupModule,
    DxTagBoxModule,
    DxLoadIndicatorModule,
    DxAccordionModule,
    DxDropDownBoxModule,
    DxListModule,
    FontAwesomeModule,
    RefreshIconModule,
    DxSwitchModule,
    GetHeightForColumnChooserDirective,
    AddRulesetModalModule,
    ImportRulesetModalModule,
    VisibilityToggleIconComponent,
    DxListModule,
    StoreTableCheckBoxComponent,
    StoreTableCheckBoxComponent,
    ProjectRulesTableModule,
    TooltipComponent,
    LogPipe,
    ValidationMessageModule,
    CollapseDirective,
    InfoComponent,
    RulesEditorMetricsComponent,
    LoaderComponent,
    RulesetPredictionConfigurationComponent,
    LoadingDirective,
    ExportDropdownComponent,
    ValueChangeArrowComponent,
  ],
})
export class ProjectRulesModule {}
