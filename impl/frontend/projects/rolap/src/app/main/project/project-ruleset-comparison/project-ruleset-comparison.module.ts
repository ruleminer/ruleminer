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
  DxDropDownButtonModule,
  DxListModule,
  DxRadioGroupModule,
  DxSwitchModule,
} from 'devextreme-angular';
import { DxiButtonModule, DxiColumnModule, DxiFieldModule, DxoStateStoringModule } from 'devextreme-angular/ui/nested';

import { CheckboxButtonComponent } from '../../../common/components/buttons/checkbox-button/checkbox-button.component';
import { ExportDropdownComponent } from '../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { RadioComponent } from '../../../common/components/buttons/radio/radio.component';
import { SelectBoxComponent } from '../../../common/components/buttons/select-box/select-box.component';
import { CardModule } from '../../../common/components/card/card.module';
import { StoreTableCheckBoxComponent } from '../../../common/components/data-grid/store-table-check-box/store-table-check-box.component';
import { RefreshIconModule } from '../../../common/components/icons/refresh-icon/refresh-icon.module';
import { InfoComponent } from '../../../common/components/info/info.component';
import { LoaderComponent } from '../../../common/components/loader/loader.component';
import { TooltipComponent } from '../../../common/components/tooltip/tooltip.component';
import { GetHeightForColumnChooserDirective } from '../../../common/directives/get-height-for-column-chooser.directive';
import { LoadingDirective } from '../../../common/directives/loading.directive';
import { LogPipe } from '../../../common/pipes/log.pipe';
import { ProjectRulesTableModule } from '../project-rules/project-rules-table/rules-table.module';
import { CalculateSimilarityButtonComponent } from './buttons/calculate-similarity-button/calculate-similarity-button.component';
import { SelectARulesetButtonComponent } from './buttons/select-a-ruleset-button/select-a-ruleset-button.component';
import { SelectRulesetsModalComponent } from './buttons/select-a-ruleset-button/select-rulesets-modal/select-rulesets-modal.component';
import { ComparisonFormComponent } from './comparison-form/comparison-form.component';
import { ComparisonHeatmapChartComponent } from './comparison-heatmap-chart/comparison-heatmap-chart.component';
import { ProjectRulesetComparisonComponent } from './project-ruleset-comparison.component';
import { RulesetComparisonTableComponent } from './ruleset-comparison-table/ruleset-comparison-table.component';

@NgModule({
  declarations: [
    ProjectRulesetComparisonComponent,
    RulesetComparisonTableComponent,
    SelectRulesetsModalComponent,
    ComparisonFormComponent,
    SelectARulesetButtonComponent,
    ComparisonHeatmapChartComponent,
    CalculateSimilarityButtonComponent,
  ],
  exports: [ProjectRulesetComparisonComponent],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    TranslateModule,
    CardModule,
    DxiColumnModule,
    DxiButtonModule,
    DxBoxModule,
    DxButtonModule,
    DxRadioGroupModule,
    DxSwitchModule,
    DxiFieldModule,
    DxListModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxCheckBoxModule,
    DxoStateStoringModule,
    RefreshIconModule,
    StoreTableCheckBoxComponent,
    GetHeightForColumnChooserDirective,
    ProjectRulesTableModule,
    LogPipe,
    TooltipComponent,
    InfoComponent,
    FormsModule,
    CheckboxButtonComponent,
    ReactiveFormsModule,
    RadioComponent,
    SelectBoxComponent,
    LoaderComponent,
    LoadingDirective,
    ExportDropdownComponent,
  ],
})
export class ProjectRulesetComparisonModule {}
