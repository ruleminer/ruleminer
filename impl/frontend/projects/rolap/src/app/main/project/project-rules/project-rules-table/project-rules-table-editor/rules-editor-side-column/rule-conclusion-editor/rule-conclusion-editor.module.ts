import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxLoadIndicatorModule,
  DxNumberBoxModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTooltipModule,
} from 'devextreme-angular';

import { CardModule } from '../../../../../../../common/components/card/card.module';
import { SurvivalCurvePlotComponent } from '../../../../survival-curve-plot/survival-curve-plot.component';
import { RegressionRuleConclusionBoxplotModule } from '../../../regression-rule-conclusion-boxplot/regression-rule-conclusion-boxplot.module';
import { ClassificationRuleConclusionEditorComponent } from './classification/classification-rule-conclusion-editor.component';
import { RegressionRuleConclusionEditorComponent } from './regression/regression-rule-conclusion-editor.component';
import { RuleConclusionEditorComponent } from './rule-conclusion-editor.component';
import { SurvivalRuleConclusionEditorComponent } from './survival/survival-rule-conclusion-editor.component';

@NgModule({
  declarations: [
    RuleConclusionEditorComponent,
    ClassificationRuleConclusionEditorComponent,
    RegressionRuleConclusionEditorComponent,
    SurvivalRuleConclusionEditorComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    DxLoadIndicatorModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxButtonModule,
    DxRadioGroupModule,
    RegressionRuleConclusionBoxplotModule,
    DxDataGridModule,
    DxTooltipModule,
    SurvivalCurvePlotComponent,
    CardModule,
  ],
  exports: [RuleConclusionEditorComponent],
})
export class RuleConclusionEditorModule {}
