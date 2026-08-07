import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import {
  DxButtonModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { TooltipComponent } from 'projects/rolap/src/app/common/components/tooltip/tooltip.component';
import { ValidationMessageModule } from 'projects/rolap/src/app/common/components/validation-message/validation-message.module';

import { DataUploadModule } from '../../../../data-upload/data-upload.module';
import { RulesetPredictionConfigurationComponent } from '../../../project-description/ruleset-prediction-configuration/ruleset-prediction-configuration.component';
import { AlgorithmRadioGroupComponent } from './algorithm-radio-group/algorithm-radio-group.component';
import { ImportRulesetModalComponent } from './import-ruleset-modal.component';

@NgModule({
  declarations: [ImportRulesetModalComponent, AlgorithmRadioGroupComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DxTextBoxModule,
    DxTextAreaModule,
    DxSelectBoxModule,
    DxButtonModule,
    ValidationMessageModule,
    DataUploadModule,
    TooltipComponent,
    DxScrollViewModule,
    DxRadioGroupModule,
    RulesetPredictionConfigurationComponent,
  ],
})
export class ImportRulesetModalModule {}
