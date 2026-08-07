import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ExecutionTimePipe } from './execution-time.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [ExecutionTimePipe],
  exports: [ExecutionTimePipe],
})
export class ExecutionTimeModule {}
