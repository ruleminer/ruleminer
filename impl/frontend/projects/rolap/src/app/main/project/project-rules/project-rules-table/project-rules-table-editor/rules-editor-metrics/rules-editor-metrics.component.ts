import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule, DxLoadIndicatorModule } from 'devextreme-angular';
import { ValuesStore } from 'projects/rolap/src/app/common/components/value-change-arrow/service/values-store';
import { ValueChangeArrowComponent } from 'projects/rolap/src/app/common/components/value-change-arrow/value-change-arrow.component';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import {
  selectIndicatorsDescriptions,
  selectIndicatorsHigherIsBetterFlags,
} from 'projects/rolap/src/app/common/store/indicatorsMeta/indicatorsMeta.selectors';

import { CardModule } from '../../../../../../common/components/card/card.module';
import { TooltipComponent } from '../../../../../../common/components/tooltip/tooltip.component';
import { EDITOR_STATE_SERVICE_TOKEN } from '../service/editor-state/editor-state.provider';

@Component({
  selector: 'rolap-rules-editor-metrics',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxDataGridModule,
    DxLoadIndicatorModule,
    ValueChangeArrowComponent,
    CardModule,
    TooltipComponent,
  ],
  templateUrl: './rules-editor-metrics.component.html',
  styleUrls: ['./rules-editor-metrics.component.scss'],
})
export class RulesEditorMetricsComponent {
  public tableValuesStore = inject(ValuesStore);
  private editorStateService = inject(EDITOR_STATE_SERVICE_TOKEN);
  private store = inject(Store<AppState>);

  public indicatorsHigherIsBetterFlags = this.store.selectSignal(selectIndicatorsHigherIsBetterFlags);
  public indicatorsDescriptions = this.store.selectSignal(selectIndicatorsDescriptions);

  public readonly displayedMetrics = this.editorStateService.displayedMetrics;
  public readonly isUserEditedSignal = this.editorStateService.isTouched;
  public readonly noDataText = 'project.rules.table.no_data';

  public readonly hasNoData = computed(() => !this.displayedMetrics()?.length);
}

