import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { ValidationMessageComponent } from './validation-message.component';

@NgModule({
  declarations: [ValidationMessageComponent],
  imports: [CommonModule, TranslateModule],
  exports: [ValidationMessageComponent],
})
export class ValidationMessageModule {}
