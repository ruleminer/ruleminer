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
  DxLoadIndicatorModule,
  DxNumberBoxModule,
  DxPopoverModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxSwitchModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxTreeViewModule,
} from 'devextreme-angular';

import { CardModule } from '../../../common/components/card/card.module';
import { TabTypeIconComponent } from '../../../common/components/icons/tab-type-icon/tab-type-icon.component';
import { InfoComponent } from '../../../common/components/info/info.component';
import { LoaderComponent } from '../../../common/components/loader/loader.component';
import { TextAreaComponent } from '../../../common/components/text-area/text-area.component';
import { TooltipComponent } from '../../../common/components/tooltip/tooltip.component';
import { ValidationMessageModule } from '../../../common/components/validation-message/validation-message.module';
import { LoadingDirective } from '../../../common/directives/loading.directive';
import { LogPipe } from '../../../common/pipes/log.pipe';
import { DataUploadModule } from '../../data-upload/data-upload.module';
import { ProjectRulesModule } from '../project-rules/project-rules.module';
import { DeleteConfirmComponent } from './treeview/modals/delete-confirm/delete-confirm.component';
import { DuplicateComponent } from './treeview/modals/duplicate/duplicate.component';
import { FilterModalComponent } from './treeview/modals/filter-modal/filter-modal.component';
import { ExplorativeDataAnalysisComponent } from './treeview/modals/generate-reports/explorative-data-analysis/explorative-data-analysis.component';
import { GenerateReportsComponent } from './treeview/modals/generate-reports/generate-reports.component';
import { KnowledgeDiscoveryComponent } from './treeview/modals/generate-reports/knowledge-discovery/knowledge-discovery.component';
import { PredictiveAnalysisComponent } from './treeview/modals/generate-reports/predictive-analysis/predictive-analysis.component';
import { ReportFormComponent } from './treeview/modals/generate-reports/report-form/report-form.component';
import { RenameComponent } from './treeview/modals/rename/rename.component';
import { SplitComponent } from './treeview/modals/split/split.component';
import { TreeFooterComponent } from './treeview/tree-footer/tree-footer.component';
import { TreeItemComponent } from './treeview/tree-item/tree-item.component';
import { TreeviewComponent } from './treeview/treeview.component';

@NgModule({
  declarations: [
    TreeviewComponent,
    TreeItemComponent,
    TreeFooterComponent,
    DeleteConfirmComponent,
    RenameComponent,
    DuplicateComponent,
    GenerateReportsComponent,
    KnowledgeDiscoveryComponent,
    PredictiveAnalysisComponent,
    ExplorativeDataAnalysisComponent,
    ReportFormComponent,
    SplitComponent,
    FilterModalComponent,
  ],
  imports: [
    CommonModule,
    DxTreeViewModule,
    DxButtonModule,
    DxPopupModule,
    DxPopoverModule,
    DataUploadModule,
    DxScrollViewModule,
    TranslateModule,
    ProjectRulesModule,
    DxDataGridModule,
    FontAwesomeModule,
    CardModule,
    DxContextMenuModule,
    DxSwitchModule,
    DxCheckBoxModule,
    DxNumberBoxModule,
    DxBoxModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    FormsModule,
    ValidationMessageModule,
    ReactiveFormsModule,
    TooltipComponent,
    DxRadioGroupModule,
    LogPipe,
    DxTooltipModule,
    InfoComponent,
    DxTextAreaModule,
    LoaderComponent,
    DxLoadIndicatorModule,
    LoadingDirective,
    TabTypeIconComponent,
    TextAreaComponent,
  ],
  exports: [TreeviewComponent, TreeItemComponent, TreeFooterComponent],
})
export class DatasetModule {}
