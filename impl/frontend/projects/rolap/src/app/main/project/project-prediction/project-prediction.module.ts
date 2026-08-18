import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxLoadIndicatorModule,
  DxLoadPanelModule,
  DxSelectBoxModule,
  DxTooltipModule,
} from 'devextreme-angular';

import { CardModule } from '../../../common/components/card/card.module';
import { TranslatedKeyValueDataGridComponent } from '../../../common/components/data-grid/translated-key-value-data-grid/translated-key-value-data-grid';
import { RefreshIconModule } from '../../../common/components/icons/refresh-icon/refresh-icon.module';
import { VisibilityToggleIconComponent } from '../../../common/components/icons/visibility-toggle-icon.component';
import { InfoComponent } from '../../../common/components/info/info.component';
import { LoaderComponent } from '../../../common/components/loader/loader.component';
import { TooltipComponent } from '../../../common/components/tooltip/tooltip.component';
import { LoadingDirective } from '../../../common/directives/loading.directive';
import { LogPipe } from '../../../common/pipes/log.pipe';
import { TruncatePipe } from '../../../common/pipes/truncate.pipe';
import { CrossValidationCardComponent } from './cross-validation-card/cross-validation-card.component';
import { DatasetTablesComponent } from './dataset-tables/dataset-tables.component';
import { PredictionHistogramComponent } from './prediction-histogram/prediction-histogram.component';
import { ConfusionMatrixComponent } from './prediction-item/confusion-matrix/confusion-matrix.component';
import { PredictedConditionComponent } from './prediction-item/predicted-condition/predicted-condition.component';
import { PredictionItemComponent } from './prediction-item/prediction-item.component';
import { PredictionPercentageComponent } from './prediction-percentage/prediction-percentage.component';
import { PredictionRoutingModule } from './prediction-routing.module';
import { PredictionTestCardComponent } from './prediction-test-card/prediction-test-card.component';
import { PredictionTestDropDownComponent } from './prediction-test-card/prediction-test-drop-down/prediction-test-drop-down.component';
import { PreditionSettingsCardComponent } from './predition-settings-card/predition-settings-card.component';
import { ProjectPredictionComponent } from './project-prediction.component';

@NgModule({
  declarations: [
    ProjectPredictionComponent,
    PredictionItemComponent,
    PredictionTestCardComponent,
    DatasetTablesComponent,
    CrossValidationCardComponent,
    PredictionTestDropDownComponent,
    PredictedConditionComponent,
    PredictionHistogramComponent,
    ConfusionMatrixComponent,
    PredictionPercentageComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    PredictionRoutingModule,
    CardModule,
    RefreshIconModule,
    DxDataGridModule,
    VisibilityToggleIconComponent,
    DxSelectBoxModule,
    DxLoadIndicatorModule,
    TranslatedKeyValueDataGridComponent,
    TooltipComponent,
    LogPipe,
    TruncatePipe,
    DxTooltipModule,
    InfoComponent,
    DxLoadPanelModule,
    LoaderComponent,
    LoadingDirective,
    PreditionSettingsCardComponent,
    DxButtonModule,
  ],
  exports: [
    ProjectPredictionComponent,
    PredictionItemComponent,
    PredictionTestCardComponent,
    DatasetTablesComponent,
    CrossValidationCardComponent,
  ],
})
export class ProjectPredictionModule {}
