import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxFileUploaderModule,
  DxProgressBarModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxTooltipModule,
} from 'devextreme-angular';
import { DxiItemModule } from 'devextreme-angular/ui/nested';

import { AppbarComponent } from '../../common/components/appbar/appbar.component';
import { CardModule } from '../../common/components/card/card.module';
import { HiglightSelectboxComponent } from '../../common/components/higlight-selectbox/higlight-selectbox.component';
import { InfoComponent } from '../../common/components/info/info.component';
import { StepperModule } from '../../common/components/stepper/stepper.module';
import { TextAreaComponent } from '../../common/components/text-area/text-area.component';
import { TooltipComponent } from '../../common/components/tooltip/tooltip.component';
import { ValidationMessageModule } from '../../common/components/validation-message/validation-message.module';
import { CommaToDotPipe } from '../../common/pipes/comma-to-dot.pipe';
import { LogPipe } from '../../common/pipes/log.pipe';
import { ColumnsChoiceComponent } from './columns-choice/columns-choice.component';
import { DataUploadRoutingModule } from './data-upload-routing.module';
import { DataUploadComponent } from './data-upload.component';
import { DatasetInfoComponent } from './dataset-info/dataset-info.component';
import { DataGridUploadHeaderComponent } from './file-format-form/data-grid-upload-header/data-grid-upload-header.component';
import { FileFormatFormComponent } from './file-format-form/file-format-form.component';
import { ProjectFormComponent } from './project-form/project-form.component';
import { UploadStepperModalComponent } from './upload-stepper-modal/upload-stepper-modal.component';

@NgModule({
  declarations: [
    DataUploadComponent,
    ColumnsChoiceComponent,
    FileFormatFormComponent,
    UploadStepperModalComponent,
    ProjectFormComponent,
    DatasetInfoComponent,
    DataGridUploadHeaderComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    DataUploadRoutingModule,
    StepperModule,
    DxFileUploaderModule,
    DxProgressBarModule,
    DxDataGridModule,
    ReactiveFormsModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    DxiItemModule,
    DxRadioGroupModule,
    TranslateModule,
    DxButtonModule,
    CardModule,
    DxTextBoxModule,
    DxRadioGroupModule,
    DxTextAreaModule,
    ValidationMessageModule,
    DxScrollViewModule,
    FontAwesomeModule,
    TooltipComponent,
    InfoComponent,
    CommaToDotPipe,
    LogPipe,
    AppbarComponent,
    DxTooltipModule,
    HiglightSelectboxComponent,
    TextAreaComponent,
  ],
  exports: [DataUploadComponent, ColumnsChoiceComponent, UploadStepperModalComponent],
})
export class DataUploadModule {}
