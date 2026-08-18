import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule, DxLoadIndicatorModule, DxTextBoxModule, DxTreeViewModule } from 'devextreme-angular';

import { ValidationMessageModule } from '../../../../../common/components/validation-message/validation-message.module';
import { AddRulesetModalComponent } from './add-ruleset-modal.component';

@NgModule({
  declarations: [AddRulesetModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    DxButtonModule,
    DxLoadIndicatorModule,
    DxTreeViewModule,
    DxTextBoxModule,
    ValidationMessageModule,
  ],
  exports: [AddRulesetModalComponent],
})
export class AddRulesetModalModule {}
