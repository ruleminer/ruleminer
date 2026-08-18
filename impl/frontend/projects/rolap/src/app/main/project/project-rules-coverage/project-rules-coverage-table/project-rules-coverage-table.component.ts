import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import {
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  combineLatest,
  debounce,
  filter,
  mergeMap,
  of,
  switchMap,
  take,
  takeUntil,
  tap,
  timer,
} from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dxDataGrid, { Row } from 'devextreme/ui/data_grid';
import { DatasetViewTableComponent } from 'projects/rolap/src/app/common/components/data-grid/dataset-view-table/dataset-view-table.component';
import { ModalService } from 'projects/rolap/src/app/common/services/modal/modal.service';
import { NotifyService } from 'projects/rolap/src/app/common/services/notify/notify.service';
import { TableInstanceService } from 'projects/rolap/src/app/common/services/table-instance/table-instance.service';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import {
  FilterOperators,
  FilteringRule,
  RulesCoverageTableStoreData,
  VisibleRule,
} from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';
import {
  selectCoverageTableDataWithCoverageData,
  selectCoverageTableDataWithoutCoverageData,
  selectUniqueCoverage,
} from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.selectors';
import { V2RulesTableMeta } from 'projects/rolap/src/app/common/store/v2RulesTable/types';
import { DataGridComponent } from 'projects/rolap/src/app/common/utils/exportUtils';
import { environment } from 'projects/rolap/src/environments/environment';

import { getCurentTabRulesetPredictionConfig } from '../../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';
import { ProblemTypes } from '../../../data-upload/utils/enums';
import { DatasetData } from '../../dataset/models/dataset';
import { DatasetConfigService } from '../../dataset/service/dataset-config.service';
import { DatasetService } from '../../dataset/service/dataset.service';
import { DownloadService } from '../../dataset/service/download.service';
import { TreeviewRefreshService } from '../../dataset/treeview/service/treeview-refresh.service';
import { DatasetCustomizeColumnsService } from '../../service/dataset-customize-columns.service';
import { ProjectService } from '../../service/project.service';
import { RefreshService } from '../../service/refresh.service';
import { CoverageMatrix, VisibleRuleColumn } from './models';
import { RulesCoverageService } from './service/rules-coverage.service';
import { CoverageTableDataAppender, RulesCoverageTableContextMenuHandler, ruleSetsRulesAreDifferent } from './utils';

export const PREDICTION_COLUMN = 'prediction';
export const COVERAGE_COLUMN_NAME_PREFIX = 'coverage-column--';
export const RULES_COVERING_EXAMPLE_COLUMN = '<rules_covering_examples>';
export type FilterMode = 'withRules' | 'withTableFilters';

@Component({
  selector: 'rolap-project-rules-coverage-table',
  templateUrl: './project-rules-coverage-table.component.html',
  styleUrls: ['./project-rules-coverage-table.component.scss'],
  providers: [RulesCoverageTableContextMenuHandler, CoverageTableDataAppender],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRulesCoverageTableComponent
  extends DatasetViewTableComponent
  implements OnInit, OnChanges, OnDestroy, DataGridComponent
{
  @Input() isOutdated: boolean | null = false;
  @Input() overwriteDatasetId: number | null;
  @Input() cardTitle: string;
  @Input() cardTooltip: string;
  @Input() showInCard: boolean = true;
  @Input() showPredictionColumn = true;
  @Input() showRulesCoverageColumns = true;
  @Input() showUniqueCoverage = false;
  @Input() filterMode: FilterMode = 'withRules';

  public readonly predictionColumnName: string = PREDICTION_COLUMN;
  public readonly rulesCoveringExampleColumnName: string = RULES_COVERING_EXAMPLE_COLUMN;
  public readonly ProblemTypes = ProblemTypes;
  public readonly ID_FIELD_NAME = this.datasetService.ID_COLUMN_DISPLAY_NAME;
  public readonly conclusionDecimalPlaces = environment.rules.conclusionDecimalPlaces;

  public problemType: ProblemTypes;
  public projectId: number;
  public ruleSetId: number;
  public filterOperator: FilterOperators;
  public decisionColumnFilterOperations: string[] = [];
  public visibleRules: VisibleRuleColumn[] = [];
  public ruleset: { rules: any[]; meta: V2RulesTableMeta };
  public rulesFilterNames: string[] = [];
  public shouldDisplayRulesFilterOperatorSelector: boolean = false;
  public isRuleSetEmpty = false;
  public isRefreshing = false;
  public visibleRulesUuids: Set<string> = new Set(); // set of visible rules uuids for faster search
  public dataGrid$: Subject<dxDataGrid> = new ReplaySubject<dxDataGrid>(1);
  public rulesUuidsToRulesNames: Record<string, string> = {};
  public numberOfRows: number;
  public rulesFilter: FilteringRule[];
  private onTableContentReadyTimer: NodeJS.Timeout | null = null;
  private rulesToFilterDataset: Set<string> = new Set();
  private uniqueExamples$ = this.store.select(selectUniqueCoverage).pipe(filterOutNullish());
  constructor(
    datasetService: DatasetService,
    store: Store<AppState>,
    projectService: ProjectService,
    modalService: ModalService,
    treeViewRefreshService: TreeviewRefreshService,
    notifyService: NotifyService,
    translate: TranslateService,
    downloadService: DownloadService,
    tableInstanceService: TableInstanceService,
    datasetConfigService: DatasetConfigService,
    private refreshService: RefreshService,
    private coverageMatrixService: RulesCoverageService,
    private contextMenuHandler: RulesCoverageTableContextMenuHandler,
    private coverageDataAppender: CoverageTableDataAppender,
    private changeDetector: ChangeDetectorRef,
    datasetCustomizeColumnsService: DatasetCustomizeColumnsService,
  ) {
    super(
      datasetService,
      store,
      projectService,
      modalService,
      treeViewRefreshService,
      notifyService,
      translate,
      downloadService,
      tableInstanceService,
      datasetConfigService,
      datasetCustomizeColumnsService,
      changeDetector,
    );
  }

  ngOnInit(): void {
    this.contextMenuHandler.setDataGrid(this.dataGrid$);
    this.coverageDataAppender.setDataGrid(this.dataGrid$);

    const selector = this.showRulesCoverageColumns
      ? selectCoverageTableDataWithCoverageData
      : selectCoverageTableDataWithoutCoverageData;

    const getCurentTabRulesetPredictionConfig$ = this.store
      .select(getCurentTabRulesetPredictionConfig)
      .pipe(filterOutNullish());
    // Downloading current tab ruleset prediction config to trigger handleStoreDataChange when it changes
    combineLatest([getCurentTabRulesetPredictionConfig$, this.store.select(selector).pipe(filterOutNullish())])
      .pipe(
        debounce(() => timer(200)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(([predictionConfig, res]) => {
        this.handleStoreDataChange(res);
      });
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['overwriteDatasetId'] && this.overwriteDatasetId !== undefined) {
      this.dataSetId = this.overwriteDatasetId!;
      this.onRuleSetOrDatasetChange();
    }
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.contextMenuHandler.ngOnDestroy();
    this.coverageDataAppender.ngOnDestroy();
  }

  public onTableInitialized(dataGridInstance: dxDataGrid<any, any>) {
    /* Without this timeout, the ExpressionChangedAfterItHasBeenCheckedError appears.
    However, the traditional solution with changeDetectorRef.detectChanges() causes the
    table to fail completely (for unknown reasons) */
    setTimeout(() => {
      this.dataGrid$.next(dataGridInstance);
    });
  }

  public onTableContentReady() {
    if (this.onTableContentReadyTimer !== null) return;
    this.onTableContentReadyTimer = setTimeout(() => {
      this.dataGrid$.pipe(filterOutNullish(), take(1), takeUntil(this.ngUnsubscribe)).subscribe(() => {
        this.onVisibleRowsChangeEvent();
      });
      this.onTableContentReadyTimer = null;
    }, 400);
  }

  public override prepareContextMenu(e: any) {
    if (!this.columns) throw new Error('Columns are not defined');
    const columnNames: string[] = this.columns.map((x) => x.name);
    this.contextMenuHandler.prepareContextMenu(e, columnNames);
  }

  public onRulesFilterOperatorChange(operator: FilterOperators) {
    this.filterOperator = operator;
    this.refreshTable();
  }

  public onInitialized(): void {
    if (!this.dataGrid) return;
    this.currentPage = 0;
    this.dataGrid.instance.pageSize(this.settings.pageSize);
    this.dataGrid.instance.pageIndex(0);
    this.dataGrid.instance.repaint();
  }

  protected override fetchData(
    limit?: number,
    offset?: number,
    sort?: {
      selector: string;
      desc: boolean;
    }[],
    filter?: any,
  ): Observable<DatasetData> {
    return this.uniqueExamples$.pipe(
      take(1),
      switchMap((uniqueCoverage) => {
        let result$: Observable<DatasetData>;
        if (this.filterMode === 'withRules') {
          const rulesetToFilter = {
            ...this.ruleset,
            rules: this.ruleset.rules.filter((rule) => this.rulesToFilterDataset.has(rule.uuid)),
          };

          result$ = this.datasetService.getDatasetFilteredByRules(
            this.dataSetId,
            limit,
            offset,
            sort,
            rulesetToFilter,
            uniqueCoverage.unique_examples,
            this.filterOperator,
          );
        } else {
          result$ = this.datasetService.getDataset(this.dataSetId, limit, offset, sort, filter);
        }
        return result$.pipe(
          tap((res) => {
            this.numberOfRows = res.count;
          }),
        );
      }),
    );
  }

  private handleStoreDataChange(res: RulesCoverageTableStoreData) {
    let shouldFetchData = true;
    const rulesetRulesChanged = ruleSetsRulesAreDifferent(this.ruleset, res.ruleset);
    this.ruleset = res.ruleset;
    this.updateRulesUuidsToRulesNamesMapping();
    this.isRuleSetEmpty = this.ruleset && this.ruleset.rules.length === 0;

    const datasetIdChanged = this.dataSetId !== res.ids.dataSetId && !this.overwriteDatasetId;
    const rulesetIdChanged = this.ruleSetId !== res.ids.ruleSetId;
    const visibleRulesChanged = this.visibleRules !== res.newVisibleRules;
    const filteringRulesChanged = this.rulesFilter !== res.newRulesFilter;
    this.ruleSetId = res.ids.ruleSetId!;
    this.projectId = res.ids.projectId!;
    this.problemType = res.projectProblemType;
    // if datasetId is overwritten by input - ignore its value from store
    if (!this.overwriteDatasetId) {
      this.dataSetId = res.ids.dataSetId!;
    }
    if (datasetIdChanged || rulesetIdChanged) {
      this.onRuleSetOrDatasetChange();
      shouldFetchData = false;
    }
    // visible rules change
    if (res.newVisibleRules !== undefined && (visibleRulesChanged || rulesetRulesChanged)) {
      this.onVisibleRulesChange(res.newVisibleRules!);
      this.onVisibleRowsChangeEvent();
    }
    // rules filter change
    if (res.newRulesFilter !== undefined && (filteringRulesChanged || rulesetRulesChanged)) {
      this.onRulesToFilterChange(res.newRulesFilter!);
    }
    // project problem type change
    if (res.projectProblemType !== undefined) this.setupDecisionColumnFilterOperations();

    if (shouldFetchData) this.fetchData();
    this.changeDetector.markForCheck();
  }

  private onVisibleRulesChange(newVisibleRules: VisibleRule[]) {
    this.visibleRules = newVisibleRules.map((rule) => ({
      ...rule,
      columnName: `${COVERAGE_COLUMN_NAME_PREFIX}${rule.uuid}`,
    }));
    this.visibleRulesUuids.clear();
    this.visibleRules.forEach((rule) => {
      this.visibleRulesUuids?.add(rule.uuid);
    });
  }

  private onVisibleRowsChangeEvent() {
    this.dataGrid$
      .pipe(
        filter((e) => !!e),
        take(1),
        mergeMap((dataGridInstance) => {
          const visibleRows: Row<any, any>[] = dataGridInstance.getVisibleRows();
          const visibleRowsIds: number[] = visibleRows.map((e) => e.key[this.datasetService.ID_COLUMN_DISPLAY_NAME]);
          // check if given rows already have coverage data appended (dxDataGrid caches previously visible pages data)
          if (this.coverageDataAppender.isCoverageDataAlreadyAppended(visibleRows)) return of(null);
          return this.fetchCoverageMatrix(visibleRowsIds).pipe(catchError(() => of(null)));
        }),
        filterOutNullish(),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((coverageMatrix: CoverageMatrix) => {
        this.coverageDataAppender.appendCoverageData(coverageMatrix, this.rulesUuidsToRulesNames);
        this.changeDetector.markForCheck();
      });
  }

  private onRulesToFilterChange(value: VisibleRule[]) {
    this.rulesFilter = value.map((rule) => ({
      ...rule,
      ruleName: this.rulesUuidsToRulesNames[rule.uuid],
    }));
    this.rulesFilterNames = value.map((e) => e.ruleName);
    this.rulesToFilterDataset.clear();
    value.forEach((e) => this.rulesToFilterDataset.add(e.uuid));
    this.shouldDisplayRulesFilterOperatorSelector = this.rulesFilterNames.length > 1;
    this.refreshTable();
  }

  private onRuleSetOrDatasetChange() {
    this.refreshDataSource();
  }

  private updateRulesUuidsToRulesNamesMapping() {
    this.rulesUuidsToRulesNames = this.ruleset.rules.reduce((acc, rule, index) => {
      acc[rule.uuid] = rule.index;
      return acc;
    }, {});
  }

  private setupDecisionColumnFilterOperations() {
    switch (this.problemType) {
      case ProblemTypes.Classification:
        this.decisionColumnFilterOperations = this.settings.nominalFilterOperations;
        break;
      case ProblemTypes.Regression:
        this.decisionColumnFilterOperations = this.settings.numericalFilterOperations;
        break;
      case ProblemTypes.Survival:
        this.decisionColumnFilterOperations = this.settings.numericalFilterOperations;
        break;
      default:
        throw new Error(`Unsupported problem type: ${this.problemType}`);
    }
  }

  private refreshTable() {
    this.isRefreshing = true;
    this.dataGrid$
      .pipe(
        filter((e) => e !== null),
        take(1),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((dataGridInstance: dxDataGrid<any, any> | null) => {
        dataGridInstance?.refresh();
        this.changeDetector.markForCheck();
      });
  }

  private fetchCoverageMatrix(rowsIds: number[]): Observable<CoverageMatrix | null> {
    if (rowsIds.length === 0 || this.ruleSetId === null || this.dataSetId === null) return of(null);
    const ids: Ids = { projectId: this.projectId, dataSetId: this.dataSetId, ruleSetId: this.ruleSetId };
    // we cannot safely use coverage stored in store as it may be outdated e.g. when new rules were added
    // and user didn't refresh any table. This line won't cause any redundant requests as it only fetches
    // coverage from API if it is outdated, otherwise it will be fetched from store
    return this.refreshService.getGlobalRulesCoverage(ids, this.ruleset).pipe(
      take(1),
      mergeMap((rulesCoverage) => {
        return this.coverageMatrixService.getRulesCoverageMatrixWithPredictions(
          this.ruleset,
          rulesCoverage,
          ids.ruleSetId!,
          ids.dataSetId!,
          rowsIds,
        );
      }),
      takeUntil(this.ngUnsubscribe),
    );
  }
}
