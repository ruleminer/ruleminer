import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FirstLetterPipe } from './first-letter.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [FirstLetterPipe],
  exports: [FirstLetterPipe],
})
export class FirstLetterModule {}
