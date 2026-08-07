import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxBoxModule,
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';

import { CardModule } from '../../../common/components/card/card.module';
import { InfoComponent } from '../../../common/components/info/info.component';
import { LoaderComponent } from '../../../common/components/loader/loader.component';
import { TooltipComponent } from '../../../common/components/tooltip/tooltip.component';
import { ValidationMessageModule } from '../../../common/components/validation-message/validation-message.module';
import { LoadingDirective } from '../../../common/directives/loading.directive';
import { DataUploadModule } from '../../data-upload/data-upload.module';
import { PreditionSettingsCardComponent } from '../project-prediction/predition-settings-card/predition-settings-card.component';
import { CoveragePredictionColumnCellComponent } from '../project-rules-coverage/coverage-prediction-column-cell/coverage-prediction-column-cell.component';
import { ProjectRulesCoverageModule } from '../project-rules-coverage/project-rules-coverage.module';
import { ComputerPredictionComponent } from './computer-prediction/computer-prediction.component';
import { PredictionExportButtonComponent } from './predition-export-button/predition-export-button.component';
import { ProjectPredictionResultComponent } from './project-prediction-result.component';

@NgModule({
  declarations: [ProjectPredictionResultComponent, ComputerPredictionComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DxDataGridModule,
    DxSelectBoxModule,
    CardModule,
    DxBoxModule,
    DxButtonModule,
    FontAwesomeModule,
    ProjectRulesCoverageModule,
    TooltipComponent,
    InfoComponent,
    CoveragePredictionColumnCellComponent,
    DataUploadModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    ValidationMessageModule,
    ReactiveFormsModule,
    LoaderComponent,
    LoadingDirective,
    PreditionSettingsCardComponent,
    PredictionExportButtonComponent,
    InfoComponent,
  ],
  exports: [ProjectPredictionResultComponent],
})
export class ProjectPredictionResultModule {}
