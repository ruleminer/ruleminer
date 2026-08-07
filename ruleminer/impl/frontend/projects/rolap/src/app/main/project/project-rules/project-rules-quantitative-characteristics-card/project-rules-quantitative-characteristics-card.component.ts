import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import DataSource from 'devextreme/data/data_source';
import { sortBy } from 'lodash';
import { ValuesStore } from 'projects/rolap/src/app/common/components/value-change-arrow/service/values-store';
import { AppState, Tabs } from 'projects/rolap/src/app/common/store/app-state.model';
import { selectIndicatorsDescriptions } from 'projects/rolap/src/app/common/store/indicatorsMeta/indicatorsMeta.selectors';
import { ruleSetQuantitativeCharacteristicsStateChange } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.action';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import {
  createArrayDataSource,
  dispatchTableState,
  mapBackendColumnNameToTranslateValue,
  mapTableObjectToArray,
} from 'projects/rolap/src/app/common/utils/dataGridUtils';

import { ExportItem } from '../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { V2RulesTableData } from '../../../../common/store/v2RulesTable/types';
import { DataGridComponent, Exporter } from '../../../../common/utils/exportUtils';
import { RefreshService } from '../../service/refresh.service';

@Component({
  selector: 'rolap-project-rules-quantitative-characteristics-card',
  templateUrl: './project-rules-quantitative-characteristics-card.component.html',
  styleUrls: ['./project-rules-quantitative-characteristics-card.component.scss'],
})
export class ProjectRulesQuantitativeCharacteristicsCardComponent
  implements OnInit, OnChanges, OnDestroy, DataGridComponent
{
  @Input() v2RulesTableData: V2RulesTableData;
  @Input() table: any;
  @Input() tab: Tabs;
  @Input() state: any;
  @Input() refresh: boolean;
  @Input() ruleSetId: number;
  @Input() dataSetId: number;
  @Input() projectId: number;

  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

  public isLoading: boolean;
  public quantitativeCharacteristics: DataSource<any, keyof any>;
  public isRefreshing = false;
  public exportCount: number | undefined;
  public exportItems: ExportItem[] = [
    {
      text: 'CSV',
      onClick: () => Exporter.exportData('csv', this, 'quantitativeCharacteristics'),
    },
    {
      text: 'XLSX',
      onClick: () => Exporter.exportData('xlsx', this, 'quantitativeCharacteristics'),
    },
  ];
  public indicatorsDescriptions = this.store.selectSignal(selectIndicatorsDescriptions);

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private translate: TranslateService,
    private store: Store<AppState>,
    private refreshService: RefreshService,
    public tableValuesStore: ValuesStore,
  ) {}

  public getTotalCount(): number {
    return this.quantitativeCharacteristics.totalCount();
  }
  public getDataGrid(): DxDataGridComponent {
    return this.dataGrid;
  }

  ngOnInit(): void {
    this.setStore();
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.setStore();
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['table']) {
      this.setStore();
      if (!this.dataGrid || !this.dataGrid.instance || !this.state) return;
      if (this.state.pageIndex) {
        this.dataGrid.instance.pageIndex(this.state.pageIndex);
      }
      this.dataGrid.instance.state(this.state);
    }
  }

  public onInitialized() {
    this.setState();
  }

  public onOptionChanged($event: any) {
    if (!this.tab) return;
    const v2TabId = this.tab.id;
    dispatchTableState($event, this.dataGrid.instance, v2TabId, (data: any) =>
      this.store.dispatch(ruleSetQuantitativeCharacteristicsStateChange(data)),
    );
  }

  public customizeColumns(columns: DxiDataGridColumn[]) {
    columns.forEach((column) => {
      if (column.dataField === 'name') {
        column.cellTemplate = 'nameCellTemplate';
      }
      column.alignment = 'left';
    });
  }

  public async refreshClick(): Promise<void> {
    this.isRefreshing = true;
    try {
      const ids: Ids = { ruleSetId: this.ruleSetId, projectId: this.projectId, dataSetId: this.dataSetId };
      await this.refreshService.refreshQuantitativeCharacteristics(this.v2RulesTableData, this.dataGrid.instance, ids);
      this.isRefreshing = false;
    } catch {
      this.isRefreshing = false;
    }
  }

  private mapData(): any {
    let mappedData = mapTableObjectToArray({ ...this.table });
    mappedData = mappedData.map((row) => {
      return {
        key: row.name,
        name: {
          title: this.translate.instant(
            `project.rules.table.headers.${mapBackendColumnNameToTranslateValue(row.name)}`,
          ),
          dataCy: row.name,
        },
        value: row.value,
      };
    });
    return sortBy(mappedData, 'name.title');
  }

  private setStore(): void {
    this.quantitativeCharacteristics = createArrayDataSource(this.mapData());
  }

  private setState(): void {
    if (!this.state) return;
    this.setIsLoading();
    this.dataGrid.instance.pageIndex(this.state.pageIndex);
    this.dataGrid.instance.state(this.state);
  }

  private setIsLoading(): void {
    this.isLoading = this.tab.data.rulesTab.quantitativeCharacteristics.isLoading;
  }
}
