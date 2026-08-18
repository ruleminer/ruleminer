import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonGroupModule, DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { SelectColumnsBtnComponent } from 'projects/rolap/src/app/common/components/buttons/select-columns-btn/select-columns-btn.component';
import { CardModule } from 'projects/rolap/src/app/common/components/card/card.module';
import { InfoComponent } from 'projects/rolap/src/app/common/components/info/info.component';
import { GetHeightForColumnChooserDirective } from 'projects/rolap/src/app/common/directives/get-height-for-column-chooser.directive';

import { DatasetCorrelationMatrixComponent } from './dataset-correlation-matrix/dataset-correlation-matrix.component';
import { DatasetCorrelationRankingComponent } from './dataset-correlation-ranking/dataset-correlation-ranking.component';
import { DatasetCorrelationTableComponent } from './dataset-correlation-table/dataset-correlation-table.component';
import { DatasetCorrelationComponent } from './dataset-correlation.component';

@NgModule({
  declarations: [
    DatasetCorrelationMatrixComponent,
    DatasetCorrelationTableComponent,
    DatasetCorrelationComponent,
    DatasetCorrelationRankingComponent,
  ],
  imports: [
    CommonModule,
    CardModule,
    FontAwesomeModule,
    TranslateModule,
    DxDataGridModule,
    DxLoadPanelModule,
    InfoComponent,
    DxButtonGroupModule,
    GetHeightForColumnChooserDirective,
    SelectColumnsBtnComponent,
  ],
  exports: [DatasetCorrelationComponent],
})
export class DatasetCorrelationModule {}
