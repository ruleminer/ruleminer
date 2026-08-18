import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { take } from 'rxjs';

import { Store } from '@ngrx/store';

import {
  ExportDropdownComponent,
  ExportItem,
} from '../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { AppState } from '../../../../common/store/app-state.model';
import { getCurentTabRulesetPredictionConfig } from '../../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';
import { selectV2PredictionSelectedDatasetId } from '../../../../common/store/v2PredictionTab/v2PredictionTab.selectors';
import {
  selectCurrentV2RulesTable,
  selectCurrentV2RulesTableActiveUuids,
} from '../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { Exporter } from '../../../../common/utils/exportUtils';
import { getFileName } from '../../../data-upload/utils/utils';
import { DownloadService } from '../../dataset/service/download.service';
import { ExportType } from '../../project-rules/project-rules-table/models/export-type';

@Component({
  selector: 'rolap-prediction-export-button',
  standalone: true,
  imports: [CommonModule, ExportDropdownComponent],
  template: ` <rolap-export-dropdown [isDisabled]="isDisabled" [exportItems]="exportItems"></rolap-export-dropdown> `,
  styles: [],
})
export class PredictionExportButtonComponent {
  @Input() isDisabled: boolean | null = false;
  public exportItems: ExportItem[] = [
    {
      text: ExportType.CSV,
      onClick: () => this.export(ExportType.CSV),
    },
    {
      text: ExportType.XLSX,
      onClick: () => this.export(ExportType.XLSX),
    },
  ];
  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  private idsSignal = this.store.selectSignal(selectCurrentV2TabIds);
  private rulesSignal = this.store.selectSignal(selectCurrentV2RulesTable);
  private selectedIdsSignal = this.store.selectSignal(selectCurrentV2RulesTableActiveUuids);
  private predictionConfigSignal = this.store.selectSignal(getCurentTabRulesetPredictionConfig);

  private downloadService = inject(DownloadService);
  private selectedDatasetIdSignal = this.store.selectSignal(selectV2PredictionSelectedDatasetId);

  public export(format: ExportType): void {
    const ids = this.idsSignal();
    const rulesData = this.rulesSignal();
    const selectedIds = this.selectedIdsSignal();
    const selectedDatasetId = this.selectedDatasetIdSignal();
    const predictionConfig = this.predictionConfigSignal();

    if (!ids || !rulesData || !selectedIds || !predictionConfig || !selectedDatasetId) return;
    const { coverage, data, meta } = rulesData;
    const { ruleSetId } = ids;

    const filteredCoverage = Object.fromEntries(Object.entries(coverage).filter(([id]) => selectedIds.includes(id)));

    const filteredRules = data
      .filter((rule) => selectedIds.includes(rule.uuid))
      .map((rule) => ({
        ...rule,
        coverage: coverage[rule.rule_uuid],
      }));

    const ruleset = {
      meta,
      rules: filteredRules,
    };

    this.downloadService
      .downloadPredictionRuleset(selectedDatasetId!, format, ruleset, filteredCoverage, ruleSetId!, predictionConfig)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const name = data.headers.get('Content-Disposition');

        Exporter.exportBlobCsv(data.body, getFileName(name));
      });
  }
}
