import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FileSizePipe } from './file-size.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [FileSizePipe],
  exports: [FileSizePipe],
})
export class FileSizeModule {}
