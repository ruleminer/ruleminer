import { Component, DestroyRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Subscription, distinctUntilChanged, filter, map, switchMap, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { DxTreeViewComponent } from 'devextreme-angular';
import { ItemClickEvent } from 'devextreme/ui/tree_view';
import { cloneDeep, isEqual } from 'lodash';

import { environment } from '../../../../../environments/environment';
import { TinyTabInfo } from '../../../../common/interfaces/tab.model';
import { AppState } from '../../../../common/store/app-state.model';
import { ProjectActions } from '../../../../common/store/project/project.action';
import {
  selectExpandedNodesReadTrigger,
  selectIsTreeDataLoading,
  selectTreeData,
  selectTreeDataError,
  selectTreeExpandedNodes,
} from '../../../../common/store/project/project.selectors';
import { Ids } from '../../../../common/store/ruleSets/rulesets.selectors';
import {
  isCompare,
  isDataSet,
  isEdaWhiteOrBoxOrPrediction,
  isProcess,
  isReport,
  isReportGroup,
  isRuleSet,
  isRuleSetGroup,
} from '../../../../common/store/v2Tabs/utils';
import { selectCurrentV2Tab } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { TimerService } from '../../process/services/timer.service';
import { MappedItem, TreeView } from '../models/treeview';
import { TreeviewRefreshService } from './service/treeview-refresh.service';
import { TreeNode } from './types';

@Component({
  selector: 'rolap-treeview',
  templateUrl: './treeview.component.html',
  styleUrls: ['./treeview.component.scss'],
})
export class TreeviewComponent implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private timerService = inject(TimerService);
  private treeRefreshService = inject(TreeviewRefreshService);
  private destroyRef = inject(DestroyRef);

  private treeViewComponent!: DxTreeViewComponent;
  private expandedNodesSubscribe: Subscription;
  @ViewChild(DxTreeViewComponent, { static: false }) set ft(treeViewComponent: DxTreeViewComponent) {
    this.treeViewComponent = treeViewComponent;
    this.checkExpandNodes();
  }

  public treeView: TreeView | null = null;
  public readonly showRetryButtonSignal = toSignal(
    this.store.select(selectTreeDataError).pipe(map((showRetryButton) => !!showRetryButton)),
    { initialValue: false },
  );

  private checkExpandNodes() {
    this.expandedNodesSubscribe?.unsubscribe();

    this.expandedNodesSubscribe = this.expandedNodes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((expandedNodes) => {
        if (!this.treeViewComponent) return;

        const sortedNodes = [...expandedNodes].sort((a, b) => {
          const getNodeDepth = (node: any) => {
            if (isDataSet(node.type)) return 1;
            if (isRuleSetGroup(node.type) || isReportGroup(node.type)) return 2;
            return 3;
          };

          const depthA = getNodeDepth(a);
          const depthB = getNodeDepth(b);

          if (depthA !== depthB) {
            return depthA - depthB;
          }

          if (a.ids.dataSetId !== b.ids.dataSetId) {
            return (a.ids.dataSetId as number) - (b.ids.dataSetId as number);
          }

          if (a.ids.ruleSetId !== b.ids.ruleSetId && a.ids.ruleSetId !== undefined && b.ids.ruleSetId !== undefined) {
            return a.ids.ruleSetId - b.ids.ruleSetId;
          }

          if (a.ids.reportId !== b.ids.reportId && a.ids.reportId !== undefined && b.ids.reportId !== undefined) {
            return a.ids.reportId - b.ids.reportId;
          }

          return 0;
        });
        sortedNodes.forEach((node) => {
          setTimeout(() => {
            this.expandBasedOnTreeNode(node);
          }, 500);
        });
      });
  }

  private readonly expandedNodes$ = this.store.select(selectExpandedNodesReadTrigger).pipe(
    filterOutNullish(),
    switchMap(() =>
      this.store.select(selectTreeExpandedNodes).pipe(
        filterOutNullish(),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        take(1),
      ),
    ),
    takeUntilDestroyed(this.destroyRef),
  );

  private readonly curremtV2Tab$ = this.store.select(selectCurrentV2Tab).pipe(
    filterOutNullish(),
    map((v2Tab) => ({ type: v2Tab.type, ids: v2Tab.ids })),
    takeUntilDestroyed(this.destroyRef),
  );

  ngOnInit(): void {
    this.timerService.startTimer(environment.refreshTimer);

    this.store
      .select(selectIsTreeDataLoading)
      .pipe(
        filter((loading) => loading === false),
        switchMap(() => this.store.select(selectTreeData).pipe(filterOutNullish())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((treeView) => {
        const mutableTreeView = cloneDeep(treeView);
        const newTree = this.removeExpanded(cloneDeep(treeView));
        const oldTree = this.treeView ? this.removeExpanded(cloneDeep(this.treeView)) : undefined;
        const treeDidntChange = isEqual(JSON.stringify(newTree), JSON.stringify(oldTree));
        if (treeDidntChange) return;

        if (newTree !== undefined && oldTree !== undefined) {
          const newItemIds = this.findNewItems(newTree, oldTree);
          this.expandNewItems(newItemIds);
        }

        this.treeView = mutableTreeView;
        this.store.dispatch(ProjectActions.triggerReadTreeExpandedNodes());
      });

    this.curremtV2Tab$.subscribe(({ type, ids }) => {
      if (isProcess(type) || isCompare(type)) return;

      const primaryHtmlId = this.treeRefreshService.generateHtmlId(ids, type);
      const elementsToExpand: string[] = [];

      if (isDataSet(type)) {
        elementsToExpand.push(primaryHtmlId);
      } else if (isRuleSet(type)) {
        elementsToExpand.push(this.treeRefreshService.generateHtmlId(ids, 'project'));
        elementsToExpand.push(this.treeRefreshService.generateHtmlId(ids, 'dataSet'));
        elementsToExpand.push(this.treeRefreshService.generateHtmlId(ids, 'ruleSetGroup'));
        elementsToExpand.push(primaryHtmlId);
      } else if (isReport(type)) {
        elementsToExpand.push(this.treeRefreshService.generateHtmlId(ids, 'project'));
        elementsToExpand.push(this.treeRefreshService.generateHtmlId(ids, 'dataSet'));
        elementsToExpand.push(this.treeRefreshService.generateHtmlId(ids, 'reportGroup'));
        elementsToExpand.push(primaryHtmlId);
      } else {
        elementsToExpand.push(primaryHtmlId);
      }

      const uniqueElementsToExpand = [...new Set(elementsToExpand)];
      uniqueElementsToExpand.forEach((id) => this.expandToDisplayTreeElement(id));
    });
  }

  ngOnDestroy() {
    this.expandedNodesSubscribe?.unsubscribe();
  }

  public reFetchTreeBtnClick() {
    this.store.dispatch(ProjectActions.signalTreeDataRefresh());
  }

  public selectItem(event: ItemClickEvent): void {
    const itemData = event.itemData as MappedItem;

    if (itemData.isDisabled) {
      event.event?.stopPropagation();
      return;
    }

    const eventType = itemData.type as TinyTabInfo['type'];
    const ids = itemData.ids;
    const treeId = itemData.id;
    const text = itemData.text;
    const id = itemData.id;

    if (isEdaWhiteOrBoxOrPrediction(eventType)) return this.treeRefreshService.openReportTab(ids, treeId, text);
    if (isDataSet(eventType)) return this.treeRefreshService.openDataSetTab(ids, text);
    if (isRuleSet(eventType)) return this.openRuleSetTab(id, ids, text);
  }

  public onItemExpanded(event: any) {
    const itemData = event.itemData as MappedItem;
    const ids = itemData.ids;
    const type = itemData.type;
    const node: TreeNode = { ids, type };
    const isUserTriggered = event.event;
    if (!isUserTriggered) return;
    this.store.dispatch(ProjectActions.addExpandedNode({ node }));
  }

  public onItemCollapsed(event: any) {
    const itemData = event.itemData as MappedItem;
    const ids = itemData.ids;
    const type = itemData.type;
    const node: TreeNode = { ids, type };
    const isUserTriggered = event.event;
    if (!isUserTriggered) return;
    this.store.dispatch(ProjectActions.removeExpandedNode({ node }));
  }

  /**
   * Extract all IDs from a tree structure recursively
   */
  private extractAllIds(tree: any[]): Set<string> {
    const ids = new Set<string>();

    const traverse = (items: any[]) => {
      for (const item of items) {
        if (item.id) {
          ids.add(item.id);
        }
        if (item.items && Array.isArray(item.items)) {
          traverse(item.items);
        }
      }
    };

    traverse(tree);
    return ids;
  }

  private findNewItems(newTree: any[], oldTree: any[]): TreeNode[] {
    const oldIds = this.extractAllIds(oldTree);
    const newTreeNodes: TreeNode[] = [];

    const traverseAndCollect = (items: any[]) => {
      for (const item of items) {
        if (item.id && !oldIds.has(item.id)) {
          if (item.ids && item.type) {
            newTreeNodes.push({ ids: item.ids, type: item.type });
          }
        }
        if (item.items && Array.isArray(item.items)) {
          traverseAndCollect(item.items);
        }
      }
    };

    traverseAndCollect(newTree);
    return newTreeNodes;
  }

  /**
   * Find new items with their full details
   */
  private findNewItemsWithDetails(newTree: any[], oldTree: any[]): MappedItem[] {
    const oldIds = this.extractAllIds(oldTree);
    const newItems: MappedItem[] = [];

    const traverse = (items: any[]) => {
      for (const item of items) {
        if (item.id && !oldIds.has(item.id)) {
          newItems.push(item);
        }
        if (item.items && Array.isArray(item.items)) {
          traverse(item.items);
        }
      }
    };

    traverse(newTree);
    return newItems;
  }

  /**
   * Auto-expand new items in the tree ngrx store
   */
  private expandNewItems(nodes: TreeNode[]): void {
    if (!this.treeViewComponent || nodes.length === 0) return;

    nodes.forEach((node) => {
      this.store.dispatch(ProjectActions.addExpandedNode({ node }));
    });
  }

  private removeExpanded(items: MappedItem[]): Partial<MappedItem>[] {
    return items.map((item) => {
      const { expanded, ...itemWithoutExpanded } = item;
      if (itemWithoutExpanded.items) {
        (itemWithoutExpanded as any).items = this.removeExpanded(itemWithoutExpanded.items);
      }
      return itemWithoutExpanded;
    });
  }

  private expandBasedOnTreeNode(node: TreeNode): void {
    const type = node.type as TinyTabInfo['type'];
    const ids = node.ids;
    let htmlIdToExpand: string | undefined;

    if (isDataSet(type)) {
      htmlIdToExpand = this.treeRefreshService.generateHtmlId(ids, 'dataSet');
    } else if (isRuleSetGroup(type)) {
      htmlIdToExpand = this.treeRefreshService.generateHtmlId(ids, 'ruleSetGroup');
    } else if (isReportGroup(type)) {
      htmlIdToExpand = this.treeRefreshService.generateHtmlId(ids, 'reportGroup');
    } else if (isRuleSet(type)) {
      htmlIdToExpand =
        ids.ruleSetId === undefined
          ? this.treeRefreshService.generateHtmlId(ids, 'ruleSetGroup')
          : this.treeRefreshService.generateHtmlId(ids, 'ruleSet');
    } else if (isReport(type)) {
      htmlIdToExpand =
        ids.reportId === undefined
          ? this.treeRefreshService.generateHtmlId(ids, 'reportGroup')
          : this.treeRefreshService.generateHtmlId(ids, 'report');
    }

    if (htmlIdToExpand) {
      this.expandToDisplayTreeElement(htmlIdToExpand);
    }
  }

  /**
   * Expand tree element.
   *
   * @param htmlId - html id of item in tree that should be expanded
   */
  private expandToDisplayTreeElement(htmlId: string) {
    if (!this.treeViewComponent) return;
    const itemHtmlElement = document.getElementById(htmlId);
    this.treeViewComponent.instance.expandItem(itemHtmlElement);
  }

  private findDataSetNameById(id: number) {
    if (!this.treeView) return null;
    const dataSetItem = this.treeView[0].items
      ?.filter((item) => item.type === 'dataSet')
      .find((item) => {
        return item.ids.dataSetId === id;
      })?.text;

    return dataSetItem;
  }

  private openRuleSetTab(treeItemId: string, ids: Ids, text: string) {
    if (!ids.dataSetId || !ids.projectId) throw new Error('rule set tab is missing project od dataset id');
    const datasetText = this.findDataSetNameById(ids.dataSetId);
    if (!datasetText) return;
    return this.treeRefreshService.openRuleSetTab(ids, text, '', datasetText);
  }
}
