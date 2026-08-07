import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxTooltipModule } from 'devextreme-angular';

import { RegressionRuleConclusionBoxplotComponent } from './regression-rule-conclusion-boxplot.component';

@NgModule({
  declarations: [RegressionRuleConclusionBoxplotComponent],
  imports: [CommonModule, TranslateModule, DxTooltipModule],
  exports: [RegressionRuleConclusionBoxplotComponent],
})
export class RegressionRuleConclusionBoxplotModule {}
