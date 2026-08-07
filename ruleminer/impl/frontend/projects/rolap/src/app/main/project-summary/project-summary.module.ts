import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';

import { CardModule } from '../../common/components/card/card.module';
import { FileSizeModule } from '../../common/pipes/file-size/file-size.module';
import { DatasetLimitCellComponent } from './dataset-limit-cell/dataset-limit-cell.component';
import { ProjectSpaceUsageComponent } from './project-space-usage/project-space-usage.component';
import { ProjectSummaryDeleteConfirmComponent } from './project-summary-delete-confirm/project-summary-delete-confirm.component';
import { ProjectSummaryDetailViewComponent } from './project-summary-detail-view/project-summary-detail-view.component';
import { ProjectSummaryRefreshBtnComponent } from './project-summary-refresh-btn/project-summary-refresh-btn.component';
import { ProjectSummaryRoutingModule } from './project-summary-routing.module';
import { ProjectSummaryTableComponent } from './project-summary-table/project-summary-table.component';
import { ProjectSummaryComponent } from './project-summary.component';

@NgModule({
  declarations: [
    ProjectSummaryComponent,
    ProjectSummaryTableComponent,
    ProjectSummaryDetailViewComponent,
    ProjectSpaceUsageComponent,
    ProjectSummaryRefreshBtnComponent,
    ProjectSummaryDeleteConfirmComponent,
    DatasetLimitCellComponent,
  ],
  imports: [
    CommonModule,
    ProjectSummaryRoutingModule,
    CardModule,
    TranslateModule,
    DxDataGridModule,
    FileSizeModule,
    DxProgressBarModule,
    FontAwesomeModule,
    DxCheckBoxModule,
    DxButtonModule,
  ],
})
export class ProjectSummaryModule {}
