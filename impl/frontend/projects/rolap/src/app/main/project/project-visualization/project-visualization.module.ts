import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxBoxModule,
  DxButtonGroupModule,
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxFormModule,
  DxListModule,
  DxNumberBoxModule,
  DxSwitchModule,
  DxTextBoxModule,
} from 'devextreme-angular';

import { CardModule } from '../../../common/components/card/card.module';
import { InfoComponent } from '../../../common/components/info/info.component';
import { LabelModule } from '../../../common/components/label/label.module';
import { LoaderComponent } from '../../../common/components/loader/loader.component';
import { CamAndSpeechComponent } from '../../../common/components/visualisation/cam-and-speech/cam-and-speech.component';
import { GraphModalComponent } from '../../../common/components/visualisation/graph-modal/graph-modal.component';
import { MetricsModalComponent } from '../../../common/components/visualisation/metrics-modal/metrics-modal.component';
import { RulsetHistogramComponent } from '../../../common/components/visualisation/rulset-histogram/rulset-histogram.component';
import { GraphPlotComponent } from '../../../common/components/visualisation/rulset-visualisation/graph-plot/graph-plot.component';
import { RulesAndConditionsInfoComponent } from '../../../common/components/visualisation/rulset-visualisation/rules-and-conditions-select-list/rules-and-conditions-label/rules-and-conditions-info.component';
import { RulesAndConditionsSearchComponent } from '../../../common/components/visualisation/rulset-visualisation/rules-and-conditions-select-list/rules-and-conditions-search/rules-and-conditions-search.component';
import { RulesAndConditionsSelectListComponent } from '../../../common/components/visualisation/rulset-visualisation/rules-and-conditions-select-list/rules-and-conditions-select-list.component';
import { RegressionConditionsCoveragePlotComponent } from '../../../common/components/visualisation/rulset-visualisation/ruleset-visualisation-coverage-info/regression-conditions-coverage-plot/regression-conditions-coverage-plot.component';
import { RulesetVisualisationCoverageInfoComponent } from '../../../common/components/visualisation/rulset-visualisation/ruleset-visualisation-coverage-info/ruleset-visualisation-coverage-info.component';
import { SurvivalConditionsCoveragePlotComponent } from '../../../common/components/visualisation/rulset-visualisation/ruleset-visualisation-coverage-info/survival-conditions-coverage-plot/survival-conditions-coverage-plot.component';
import { RulesetVisualisationLegendComponent } from '../../../common/components/visualisation/rulset-visualisation/ruleset-visualisation-legend/ruleset-visualisation-legend.component';
import { RulsetVisualisationComponent } from '../../../common/components/visualisation/rulset-visualisation/rulset-visualisation.component';
import { LoadingDirective } from '../../../common/directives/loading.directive';
import { RegressionRuleConclusionBoxplotModule } from '../project-rules/project-rules-table/regression-rule-conclusion-boxplot/regression-rule-conclusion-boxplot.module';
import { ProjectVisualizationComponent } from './project-visualization.component';
import { VisualizationRoutingModule } from './visualization-routing.module';

@NgModule({
  declarations: [
    ProjectVisualizationComponent,
    RulsetVisualisationComponent,
    RulsetHistogramComponent,
    CamAndSpeechComponent,
    GraphModalComponent,
    MetricsModalComponent,
    RulesAndConditionsSelectListComponent,
    RulesetVisualisationLegendComponent,
    RulesetVisualisationCoverageInfoComponent,
    RegressionConditionsCoveragePlotComponent,
    RulesAndConditionsInfoComponent,
    GraphPlotComponent,
    RulesAndConditionsSearchComponent,
  ],
  exports: [ProjectVisualizationComponent],
  imports: [
    CommonModule,
    TranslateModule,
    VisualizationRoutingModule,
    CardModule,
    DxFormModule,
    DxTextBoxModule,
    DxButtonModule,
    FontAwesomeModule,
    DxListModule,
    DxCheckBoxModule,
    DxSwitchModule,
    DxBoxModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxButtonGroupModule,
    DxNumberBoxModule,
    FormsModule,
    RegressionRuleConclusionBoxplotModule,
    SurvivalConditionsCoveragePlotComponent,
    LabelModule,
    InfoComponent,
    LoaderComponent,
    LoadingDirective,
  ],
})
export class ProjectVisualizationModule {}
