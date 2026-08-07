import { Injectable } from '@angular/core';
import { Observable, Subject, map, switchMap, take, distinctUntilChanged, skip } from 'rxjs';
import { Store } from '@ngrx/store';
import { isUndefined } from 'lodash';

import {
  AppState,
  CompareTab,
  DataSetTab,
  RefreshAllState,
  ReportTab,
  RuleSetTab,
  TabType,
  Tabs,
} from 'projects/rolap/src/app/common/store/app-state.model';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import { selectAllV2Tabs } from 'projects/rolap/src/app/common/store/v2Tabs/v2Tabs.selectors';

import { TabsActions } from '../../../../../common/store/ruleSets/tabs.action';
import { V2CurrentTabAction } from '../../../../../common/store/v2CurrentTab/v2CurrentTab.action';
import {
  RolapItemTypes,
  generateNgrxKey,
  isDataSet,
  isRuleSetGroup,
} from '../../../../../common/store/v2Tabs/utils';
import { ProjectService } from '../../../service/project.service';
import { MappedItem, TreeViewItem } from '../../models/treeview';
import { DatasetService } from '../../service/dataset.service';

import {
  selectTreeDataRefreshTrigger
} from '../../../../../common/store/project/project.selectors';

@Injectable({
  providedIn: 'root',
})
export class TreeviewRefreshService {
  public treeRefreshObserver: Observable<true>;
  private ngUnsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private projectService: ProjectService,
    private datasetService: DatasetService,
  ) {
    this.treeRefreshObserver = this.store.select(selectTreeDataRefreshTrigger).pipe(
      distinctUntilChanged(),
      skip(1),
      map(() => true as const)
    );
  }

  public finishListeningToProjectTreeChanges(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }

  public getTreeItems(projectId: number): Observable<MappedItem[]> {
    return this.projectService.getTreeView<TreeViewItem>(projectId).pipe(map((treeView) => [this.mapToItem(treeView)]));
  }

  public getTreeItemsOnlyRulesets(projectId: number): Observable<MappedItem[]> {
    return this.getTreeItemsWithoutReports(projectId).pipe(map((tree) => this.moveUpRulestsGroupItems(tree)));
  }

  public getTreeItemsOnlyRulesetsWithDatasetAttributes(projectId: number, datasetId: number) {
    return this.getTreeItemsOnlyRulesets(projectId).pipe(
      switchMap((treeView) => {
        return this.datasetService
          .getMatchingDatasets(projectId, { dataset_id: datasetId, must_contain_all_given_attributes: false })
          .pipe(map((matchingDatasets) => ({ treeView, matchingDatasets })));
      }),
    );
  }

  public filterMatchingDatasetFromTreeData(
    matchingDatasets: { id: number; name: string }[],
    treeView: MappedItem[],
  ): MappedItem[] {
    const matchingDatasetsIds = new Set(matchingDatasets.map((x) => x.id));
    function filterRecursive(item: MappedItem) {
      if (!item.items) return;
      if (item.items[0].type === 'dataSet') {
        item.items = item.items.filter((x) => matchingDatasetsIds.has(x.ids.dataSetId!));
      } else {
        item.items.forEach(filterRecursive);
      }
    }
    const filteredTree = [...treeView];
    filteredTree.forEach(filterRecursive);
    return filteredTree;
  }

  private getTreeItemsWithoutReports(projectId: number): Observable<MappedItem[]> {
    return this.getTreeItems(projectId).pipe(map((tree) => this.filterOutReportsFromTree(tree)));
  }

  private filterOutReportsFromTree(items: MappedItem[]): MappedItem[] {
    return items
      .filter((item) => item.type !== 'reports_group')
      .map((item) => ({
        ...item,
        items: item.items ? this.filterOutReportsFromTree(item.items) : [],
      }));
  }

  private moveUpRulestsGroupItems(items: MappedItem[]): MappedItem[] {
    const processNode = (node: any) => {
      if (isRuleSetGroup(node.type)) return node.items;
      if (node.items && node.items.length) {
        node.items = node.items.map(processNode).flat();
      }
      return node;
    };
    return items.map(processNode);
  }

  private mapToItem(treeView: TreeViewItem): MappedItem {
    const mapItemsRecursive = (items: TreeViewItem[]): MappedItem[] =>
      items.map((item) => {
        return {
          id: generateNgrxKey(item.project_id, item.dataset_id, item.ruleset_id, item.report_id, item.type as string),
          text: item.text,
          isDisabled: item.is_active === false,
          expanded: false,
          type: item.type ? this.mapBackendItemType(item.type) : undefined,
          ids: {
            projectId: item.project_id,
            dataSetId: item.dataset_id,
            ...(item.ruleset_id && { ruleSetId: item.ruleset_id }),
            ...(item.report_id && { reportId: item.report_id }),
          },
          ...(!isUndefined(item.limit_reached) && { limitReached: item.limit_reached }),
          items: item.items ? mapItemsRecursive(item.items) : [],
        };
      });

    return {
      id: treeView.id,
      text: treeView.text,
      expanded: true,
      ids: {
        projectId: treeView.project_id,
        dataSetId: undefined,
        ruleSetId: undefined,
      },
      isDisabled: false,
      items: treeView.items ? mapItemsRecursive(treeView.items) : [],
    };
  }

  private mapBackendItemType(type: string): RolapItemTypes {
    if (type === 'dataset') return 'dataSet';
    if (type === 'ruleset') return 'ruleSet';
    return type as RolapItemTypes;
  }

  public openDataSetTab(ids: Ids, text: string, description = '') {
    const dataSet = this.createDataSetObject(ids, text, description);
    this.store.dispatch(
      TabsActions.addDataSet({ tab: dataSet, text: text, description: description, datasetText: '', ids }),
    );
    const ngrxKey = generateNgrxKey(ids.projectId!, ids.dataSetId!, ids.ruleSetId!, 0, 'dataSet');
    this.store.dispatch(V2CurrentTabAction.setCurrentTab({ currentTab: ngrxKey }));
  }

  public openRuleSetTab(ids: Ids, text: string, description = '', datasetText?: string) {
    const ruleSet = this.createRuleSetObject(ids, text, description, datasetText!);
    const ngrxKey = generateNgrxKey(ids.projectId!, ids.dataSetId!, ids.ruleSetId!, 0, 'ruleSet');
    this.store
      .select(selectAllV2Tabs)
      .pipe(take(1))
      .subscribe((res) => {
        const isRuleSetAlreadyOpened = res.some((x) => x.id === ngrxKey);
        if (!isRuleSetAlreadyOpened) {
          this.store.dispatch(
            TabsActions.addRuleSet({
              tab: ruleSet,
              text: text,
              description: description,
              datasetText: datasetText!,
              ids,
            }),
          );
        }
        this.store.dispatch(V2CurrentTabAction.setCurrentTab({ currentTab: ngrxKey }));
      });
  }

  public openReportTab(ids: Ids, treeId: string, text: string, description = '') {
    const report = this.createReportObject(ids, treeId, text, description);
    this.store.dispatch(TabsActions.addReport({ tab: report, text, description, datasetText: '', ids }));
    const ngrxKey = generateNgrxKey(ids.projectId!, ids.dataSetId!, ids.ruleSetId!, ids.reportId!, 'report');
    this.store.dispatch(V2CurrentTabAction.setCurrentTab({ currentTab: ngrxKey }));
  }


  public openCompareTab(ids: Ids, text: string, description = '') {
    const id = generateNgrxKey(ids.projectId!, ids.dataSetId!, ids.ruleSetId!, ids.reportId!, 'compare');
    const compare: CompareTab = {
      id,
    };
    this.store.dispatch(TabsActions.addCompare({ tab: compare, ids }));
    this.store.dispatch(V2CurrentTabAction.setCurrentTab({ currentTab: id }));
  }


  public createDataSetObject(ids: Ids, text: string, description = ''): DataSetTab {
    return this.createBaseTabsObject(ids, text, description, 'dataSet') as DataSetTab;
  }

  private createRuleSetObject(ids: Ids, text: string, description = '', datasetText: string): RuleSetTab {
    return this.createBaseTabsObject(ids, text, description, 'ruleSet', datasetText) as RuleSetTab;
  }

  private createReportObject(ids: Ids, treeId: string, text: string, description = ''): ReportTab {
    if (!ids.projectId || !ids.dataSetId || !ids.reportId) throw new Error('Missing ids for report tab');
    const [projectId, dataSetId, reportId] = [ids.projectId, ids.dataSetId, ids.reportId];
    const id = generateNgrxKey(projectId, dataSetId, 0, reportId, 'report');
    return {
      id,
      data: null,
    };
  }

  private createBaseTabsObject(ids: Ids, text: string, description: string, type: TabType, datasetText?: string): Partial<DataSetTab | RuleSetTab> {
    let id = generateNgrxKey(ids.projectId!, ids.dataSetId!, ids.ruleSetId!, 0, 'ruleSet');
    if (isDataSet(type)) {
      id = generateNgrxKey(ids.projectId!, ids.dataSetId!, 0, 0, 'dataSet');
    }
    return {
      id,
      data: this.createInitialData(),
    };
  }

  private createInitialData(): Tabs['data'] {
    return {
      rulesTab: {
        refreshAll: RefreshAllState.CLICKABLE,
        predictionIndicators: {
          table: {},
          state: null,
          refresh: false,
          isLoading: true,
        },
        quantitativeCharacteristics: {
          table: {},
          state: null,
          refresh: false,
          isLoading: true,
        },
        importance: {
          refresh: false,
          conditionImportance: {
            table: {},
            state: null,
          },
          attributesImportance: {
            table: {},
            state: null,
          },
          isLoading: true,
        },
      },
      predictionTab: {
        refreshAll: RefreshAllState.CLICKABLE,
        trainingDataRefresh: false,
        testCard: {
          refresh: false,
          selectedDataSet: null,
          data: null,
        },
        predictionIndicators: {},
      },
      datasetTab: {
        statisticsTab: [],
      },
      histogramTab: {
        attribute_importance: [],
        condition_importance: [],
        maxAttributeElements: 10,
        maxConditionElements: 10,
        attribute_plot_type: true,
      },
    };
  }

  public generateHtmlId(ids: Ids, type: string): string {
    const projectPrefix = `item-${ids.projectId}`;
    switch (type) {
      case 'project':
        return projectPrefix;
      case 'dataSet':
        return `${projectPrefix}-${ids.dataSetId}-0-0-dataSet`;
      case 'ruleSetGroup':
        return `${projectPrefix}-${ids.dataSetId}-0-0-rulesets_group`;
      case 'reportGroup':
        return `${projectPrefix}-${ids.dataSetId}-0-0-reports_group`;
      case 'ruleSet':
        return `${projectPrefix}-${ids.dataSetId}-${ids.ruleSetId}-0-ruleSet`;
      case 'report':
        return `${projectPrefix}-${ids.dataSetId}-0-${ids.reportId}-report`;
      default:
        throw new Error(`Unknown type for HTML ID generation: ${type}`);
    }
  }
}