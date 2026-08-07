import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { RefreshIconComponent } from './refresh-icon.component';

@NgModule({
  declarations: [RefreshIconComponent],
  imports: [CommonModule, FontAwesomeModule, TranslateModule],
  exports: [RefreshIconComponent],
})
export class RefreshIconModule {}
