import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxCheckBoxModule,
  DxDataGridModule,
  DxLoadPanelModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxTooltipModule,
} from 'devextreme-angular';
import { DxiButtonModule, DxiColumnModule, DxoStateStoringModule } from 'devextreme-angular/ui/nested';

import { ExportDropdownComponent } from '../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { CardModule } from '../../../common/components/card/card.module';
import { DatasetViewTableComponent } from '../../../common/components/data-grid/dataset-view-table/dataset-view-table.component';
import { StoreTableCheckBoxComponent } from '../../../common/components/data-grid/store-table-check-box/store-table-check-box.component';
import { TranslatedKeyValueDataGridComponent } from '../../../common/components/data-grid/translated-key-value-data-grid/translated-key-value-data-grid';
import { RefreshIconModule } from '../../../common/components/icons/refresh-icon/refresh-icon.module';
import { InfoComponent } from '../../../common/components/info/info.component';
import { LoaderComponent } from '../../../common/components/loader/loader.component';
import { SummaryItemSpanComponent } from '../../../common/components/summary-item-span/summary-item-span.component';
import { TooltipComponent } from '../../../common/components/tooltip/tooltip.component';
import { GetHeightForColumnChooserDirective } from '../../../common/directives/get-height-for-column-chooser.directive';
import { LoadingDirective } from '../../../common/directives/loading.directive';
import { LogPipe } from '../../../common/pipes/log.pipe';
import { ProjectRulesTableModule } from '../project-rules/project-rules-table/rules-table.module';
import { ColoredCellBasedOnIdComponent } from './colored-cell-based-on-id/colored-cell-based-on-id.component';
import { CoveragePredictionColumnCellComponent } from './coverage-prediction-column-cell/coverage-prediction-column-cell.component';
import { CoverageTableRulesFilterOperatorSelectorComponent } from './coverage-table-rules-filter-operator-selector/coverage-table-rules-filter-operator-selector.component';
import { NumberOfRulesCoveringExampleComponent } from './project-rules-coverage-table/number-of-rules-covering-example/number-of-rules-covering-example.component';
import { ProjectRulesCoverageFilteringRulesListComponent } from './project-rules-coverage-table/project-rules-coverage-filtering-rules-list/project-rules-coverage-filtering-rules-list.component';
import { ProjectRulesCoverageTableActionsComponent } from './project-rules-coverage-table/project-rules-coverage-table-actions/project-rules-coverage-table-actions.component';
import { ProjectRulesCoverageTableComponent } from './project-rules-coverage-table/project-rules-coverage-table.component';
import { RuleChipsComponent } from './project-rules-coverage-table/rule-chips/rule-chips.component';
import { RulesFilterUniqueCoverageTableComponent } from './project-rules-coverage-table/rules-filter-unique-coverage-table/rules-filter-unique-coverage-table.component';
import { RulesFilterUniqueCoverageToggleComponent } from './project-rules-coverage-table/rules-filter-unique-coverage-toggle/rules-filter-unique-coverage-toggle.component';
import { ProjectRulesCoverageComponent } from './project-rules-coverage.component';

@NgModule({
  declarations: [
    ProjectRulesCoverageComponent,
    ProjectRulesCoverageTableComponent,
    ProjectRulesCoverageTableActionsComponent,
    CoverageTableRulesFilterOperatorSelectorComponent,
    ProjectRulesCoverageFilteringRulesListComponent,
    NumberOfRulesCoveringExampleComponent,
    RuleChipsComponent,
    RulesFilterUniqueCoverageToggleComponent,
    RulesFilterUniqueCoverageTableComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    CardModule,
    FontAwesomeModule,
    DxiColumnModule,
    DxiButtonModule,
    DxLoadPanelModule,
    DxRadioGroupModule,
    DxScrollViewModule,
    DxDataGridModule,
    DxCheckBoxModule,
    DxTooltipModule,
    DxoStateStoringModule,
    RefreshIconModule,
    StoreTableCheckBoxComponent,
    ColoredCellBasedOnIdComponent,
    ProjectRulesTableModule,
    TooltipComponent,
    InfoComponent,
    CoveragePredictionColumnCellComponent,
    DatasetViewTableComponent,
    GetHeightForColumnChooserDirective,
    LoaderComponent,
    LogPipe,
    LoadingDirective,
    SummaryItemSpanComponent,
    TranslatedKeyValueDataGridComponent,
    LogPipe,
    ExportDropdownComponent,
  ],
  exports: [ProjectRulesCoverageComponent, ProjectRulesCoverageTableComponent],
})
export class ProjectRulesCoverageModule {}
