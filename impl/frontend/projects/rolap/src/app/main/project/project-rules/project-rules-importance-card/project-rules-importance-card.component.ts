import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';

import { ExportItem } from '../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { V2RulesTableData } from '../../../../common/store/v2RulesTable/types';
import { Exporter } from '../../../../common/utils/exportUtils';
import { ProblemTypes } from '../../../data-upload/utils/enums';
import { getFileName } from '../../../data-upload/utils/utils';
import { DownloadService } from '../../dataset/service/download.service';
import { RefreshService } from '../../service/refresh.service';
import { ExportType } from '../project-rules-table/models/export-type';

@Component({
  selector: 'rolap-project-rules-importance-card',
  templateUrl: './project-rules-importance-card.component.html',
  styleUrls: ['./project-rules-importance-card.component.scss'],
})
export class ProjectRulesImportanceCardComponent implements OnDestroy, OnInit {
  @Input() v2RulesTableData: V2RulesTableData;
  @Input() tab: any;
  @Input() refresh: boolean;
  @Input() importance: any;
  @Input() ruleSetId: number;
  @Input() dataSetId: number;
  @Input() projectId: number;
  @Input() typeOfProblem: ProblemTypes;
  public isRefreshing = false;
  public ProblemTypes = ProblemTypes;
  private ngUnsubscribe: Subject<void> = new Subject();
  public exportItemsCondition: ExportItem[] = [];
  public exportItemsAttribute: ExportItem[] = [];

  constructor(private refreshService: RefreshService, private downloadService: DownloadService) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.setupExportItems();
  }

  public async refreshClick(): Promise<void> {
    this.isRefreshing = true;
    try {
      const ids: Ids = { ruleSetId: this.ruleSetId, projectId: this.projectId, dataSetId: this.dataSetId };
      await this.refreshService.refreshImportance(this.v2RulesTableData, null, ids);
      this.isRefreshing = false;
    } catch (e) {
      this.isRefreshing = false;
    }
  }

  private setupExportItems(): void {
    this.exportItemsCondition = [
      {
        text: ExportType.CSV,
        onClick: () => this.exportCombined(ExportType.CSV, 'condition'),
      },
      {
        text: ExportType.XLSX,
        onClick: () => this.exportCombined(ExportType.XLSX, 'condition'),
      },
    ];
    this.exportItemsAttribute = [
      {
        text: ExportType.CSV,
        onClick: () => this.exportCombined(ExportType.CSV, 'attribute'),
      },
      {
        text: ExportType.XLSX,
        onClick: () => this.exportCombined(ExportType.XLSX, 'attribute'),
      },
    ];
  }

  private exportCombined(format: ExportType, importance_of: 'condition' | 'attribute'): void {
    this.downloadService
      .downloadRulesetImportance(this.ruleSetId, format, importance_of)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        const name = data.headers.get('Content-Disposition');

        Exporter.exportBlobCsv(data.body, getFileName(name));
      });
  }
}
