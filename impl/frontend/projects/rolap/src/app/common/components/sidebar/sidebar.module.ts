import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { DxButtonModule } from 'devextreme-angular';

import { DatasetModule } from '../../../main/project/dataset/dataset.module';
import { SidebarComponent } from './sidebar.component';

@NgModule({
  declarations: [SidebarComponent],
  imports: [CommonModule, DatasetModule, DxButtonModule],
  exports: [SidebarComponent],
})
export class SidebarModule {}
