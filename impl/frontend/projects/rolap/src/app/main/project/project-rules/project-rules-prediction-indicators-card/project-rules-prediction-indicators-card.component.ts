import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Subject, map, takeUntil } from 'rxjs';

import { faFileCsv, faFileExcel } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import DataSource from 'devextreme/data/data_source';
import { sortBy } from 'lodash';
import { ValuesStore } from 'projects/rolap/src/app/common/components/value-change-arrow/service/values-store';
import { AppState, PredictionIndicators, Tabs } from 'projects/rolap/src/app/common/store/app-state.model';
import { selectIndicatorsDescriptions } from 'projects/rolap/src/app/common/store/indicatorsMeta/indicatorsMeta.selectors';
import { ruleSetPredictionIndicatorsStateChange } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.action';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import {
  createArrayDataSource,
  dispatchTableState,
  mapBackendColumnNameToTranslateValue,
  mapTableObjectToArray,
} from 'projects/rolap/src/app/common/utils/dataGridUtils';

import { ExportItem } from '../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { V2RulesTableData } from '../../../../common/store/v2RulesTable/types';
import { selectCurrentV2Tab } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { DataGridComponent, Exporter } from '../../../../common/utils/exportUtils';
import { RefreshService } from '../../service/refresh.service';

@Component({
  selector: 'rolap-project-rules-prediction-indicators-card',
  templateUrl: './project-rules-prediction-indicators-card.component.html',
  styleUrls: ['./project-rules-prediction-indicators-card.component.scss'],
})
export class ProjectRulesPredictionIndicatorsCardComponent implements OnInit, OnChanges, OnDestroy, DataGridComponent {
  @Input() v2RulesTableData: V2RulesTableData;
  @Input() table: any;
  @Input() tab: Tabs;
  @Input() state: any;
  @Input() refresh: boolean;
  @Input() ruleSetId: number;
  @Input() dataSetId: number;
  @Input() projectId: number;
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  public dataSetName$ = this.store.select(selectCurrentV2Tab).pipe(map((v2Tab) => v2Tab?.datasetText || ''));
  public predictionIndicators: DataSource<PredictionIndicators, keyof PredictionIndicators>;
  public isRefreshing = false;
  private ngUnsubscribe: Subject<void> = new Subject();
  public isLoading: boolean;
  public faFileCsv = faFileCsv;
  public faFileExcel = faFileExcel;
  public exportCount: number | undefined;

  public exportItems: ExportItem[] = [];
  public indicatorsDescriptions = this.store.selectSignal(selectIndicatorsDescriptions);

  constructor(
    private translate: TranslateService,
    private store: Store<AppState>,
    private refreshService: RefreshService,
    public tableValuesStore: ValuesStore,
  ) {}

  public getTotalCount(): number {
    return this.predictionIndicators.totalCount();
  }

  public getDataGrid(): DxDataGridComponent {
    return this.dataGrid;
  }

  ngOnInit(): void {
    this.setStore();
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.setStore();
    });
    this.setupExportItems();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['table'] || changes['refresh']) {
      this.setStore();
      if (!this.dataGrid || !this.dataGrid.instance || !this.state) return;
      if (this.state.pageIndex) {
        this.dataGrid.instance.pageIndex(this.state.pageIndex);
      }
      this.dataGrid.instance.state(this.state);
    }
  }

  public onInitialized(): void {
    this.setState();
  }

  public onOptionChanged($event: any): void {
    const v2TabId = this.tab.id;
    dispatchTableState($event, this.dataGrid.instance, v2TabId, (data: any) =>
      this.store.dispatch(ruleSetPredictionIndicatorsStateChange(data)),
    );
  }

  public customizeColumns(columns: DxiDataGridColumn[]) {
    columns.forEach((column) => (column.alignment = 'left'));
  }

  public async refreshClick(): Promise<void> {
    this.isRefreshing = true;
    try {
      const ids: Ids = { ruleSetId: this.ruleSetId, projectId: this.projectId, dataSetId: this.dataSetId };
      await this.refreshService.refreshPredictionIndicators(this.v2RulesTableData, this.dataGrid.instance, ids);
      this.isRefreshing = false;
    } catch {
      this.isRefreshing = false;
    }
  }

  private mapData() {
    const { ...filteredTable } = { ...this.table };
    if ('Covered_by_prediction' in filteredTable && 'Not_covered_by_prediction' in filteredTable) {
      delete (filteredTable as any).Covered_by_prediction;
      delete (filteredTable as any).Not_covered_by_prediction;
    }

    const mappedData = mapTableObjectToArray(filteredTable);

    mappedData.map((row) => {
      row.key = row.name;
      row.name = this.translate.instant(
        `project.rules.table.headers.${mapBackendColumnNameToTranslateValue(row.name)}`,
      );
    });

    return sortBy(mappedData, 'name');
  }

  private setStore(): void {
    this.predictionIndicators = createArrayDataSource(this.mapData());
  }

  private setState(): void {
    if (!this.state) return;
    this.setIsLoading();
    this.dataGrid.instance.pageIndex(this.state.pageIndex);
    this.dataGrid.instance.state(this.state);
  }

  private setIsLoading(): void {
    this.isLoading = this.tab.data.rulesTab.predictionIndicators.isLoading;
  }

  private setupExportItems(): void {
    this.exportItems = [
      {
        text: 'CSV',
        onClick: () => Exporter.exportData('csv', this, 'indicators'),
      },
      {
        text: 'XLSX',
        onClick: () => Exporter.exportData('xlsx', this, 'indicators'),
      },
    ];
  }
}
