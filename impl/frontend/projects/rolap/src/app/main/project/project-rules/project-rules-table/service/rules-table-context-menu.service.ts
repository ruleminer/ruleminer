import { Injectable } from '@angular/core';

import { filter, map, switchMap, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ContextMenuItem } from 'projects/rolap/src/app/common/interfaces/context-menu.model';
import { ModalRef } from 'projects/rolap/src/app/common/services/modal/modal-ref';
import { ModalService } from 'projects/rolap/src/app/common/services/modal/modal.service';
import { TableInstanceService } from 'projects/rolap/src/app/common/services/table-instance/table-instance.service';
import { AppState, RuleTableUse, SubTabsNames } from 'projects/rolap/src/app/common/store/app-state.model';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';

import { V2RulesTableActions } from '../../../../../common/store/v2RulesTable/v2RulesTable.action';
import { generateNgrxKey, isRuleSetV2 } from '../../../../../common/store/v2Tabs/utils';
import { V2TabsActions } from '../../../../../common/store/v2Tabs/v2Tabs.action';
import { selectAllV2Tabs } from '../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { V2VisualizationTabActions } from '../../../../../common/store/v2VisualizationTab/v2VisualizationTab.action';
import { ProblemTypes } from '../../../../data-upload/utils/enums';
import { MappedItem } from '../../../dataset/models/treeview';
import { TreeviewRefreshService } from '../../../dataset/treeview/service/treeview-refresh.service';
import { RefreshService } from '../../../service/refresh.service';
import { TreeComponent } from '../../modals/project-generate-rule-set-modal/tree/tree.component';
import { RegressionRuleHistogramComponent } from '../../regression-rule-histogram/regression-rule-histogram.component';
import { SurvivalRuleCurvePlotComponent } from '../../survival-rule-curve-plot/survival-rule-curve-plot.component';

@Injectable({
  providedIn: 'root',
})
export class RulesTableContextMenuService {
  constructor(
    private translate: TranslateService,
    private tableInstanceService: TableInstanceService,
    private modalService: ModalService,
    private treeRefreshService: TreeviewRefreshService,
    private refreshService: RefreshService,
    private store: Store<AppState>,
  ) {}

  public getContextMenuItems(
    currentSubTab: SubTabsNames | RuleTableUse,
    problemType: ProblemTypes,
    selectedRowsUuids: Set<string>,
    ids: Ids,
    datasetText: string,
  ): ContextMenuItem[] {
    const contextMenuItems: ContextMenuItem[] = [];
    const currentTabKey = generateNgrxKey(ids.projectId!, ids.dataSetId!, ids.ruleSetId!, 0, 'ruleSet');
    if (currentSubTab !== SubTabsNames.RULES_COVERAGE) {
      contextMenuItems.push({
        text: this.translate.instant('project.rules.table.context_menu.rules_coverage'),
        onItemClick: () => {
          this.store.dispatch(V2TabsActions.setCurrentSubTabIndexBySubTabName({ name: SubTabsNames.RULES_COVERAGE }));
        },
      });
    }
    if (currentSubTab !== SubTabsNames.RULE_COMPARISON) {
      contextMenuItems.push({
        text: this.translate.instant('project.rules.table.context_menu.rules_comparison'),
        onItemClick: () =>
          this.store.dispatch(V2TabsActions.setCurrentSubTabIndexBySubTabName({ name: SubTabsNames.RULE_COMPARISON })),
      });
    }
    if (currentSubTab !== SubTabsNames.VISUALISATION) {
      contextMenuItems.push({
        text: this.translate.instant('project.rules.table.context_menu.visualization'),
        onItemClick: () => {
          const selectedRows = this.tableInstanceService.getSelectedRowsUuids();
          this.store.dispatch(V2VisualizationTabActions.setRulesAndClearSearch({ rulesUUIDs: selectedRows }));
          this.store.dispatch(V2TabsActions.setCurrentSubTabIndexBySubTabName({ name: SubTabsNames.VISUALISATION }));
        },
      });
    }
    if (currentSubTab === SubTabsNames.RULES) {
      contextMenuItems.push({
        text: this.translate.instant('project.rules.table.context_menu.copy'),
        onItemClick: () => {
          this.openCopyRuleModal(ids, selectedRowsUuids, datasetText, currentTabKey);
        },
      });
    }
    if (problemType === ProblemTypes.Regression) {
      contextMenuItems.push({
        text: this.translate.instant('project.rules.table.context_menu.histogram'),
        onItemClick: () => this.openRegressionRuleHistogramModal(ids, selectedRowsUuids),
      });
    }
    if (problemType === ProblemTypes.Survival) {
      contextMenuItems.push({
        text: this.translate.instant('project.rules.table.context_menu.survival_curve'),
        onItemClick: () => this.openSurvivalCurvePlotModal(selectedRowsUuids),
      });
    }

    return contextMenuItems;
  }

  private openRegressionRuleHistogramModal(ids: Ids, selectedRowsUuids: Set<string>) {
    this.modalService.open(
      RegressionRuleHistogramComponent,
      this.translate.instant('project.rules.rule_histogram.title'),
      'calc(100vw - 4rem)',
      'auto',
      {
        datasetId: ids.dataSetId,
        ruleUuids: selectedRowsUuids,
      },
    );
  }

  private openSurvivalCurvePlotModal(selectedRowsUuids: Set<string>) {
    this.modalService.open(
      SurvivalRuleCurvePlotComponent,
      this.translate.instant('project.rules.rule_survival_curve_plot.title'),
      'calc(100vw - 4rem)',
      'auto',
      {
        selectedRowsUuids,
      },
    );
  }
// In RulesTableContextMenuService class

private openCopyRuleModal(ids: Ids, selectedRowsUuids: Set<string>, datasetText: string, currentTableKey: string) {
  this.store
    .select(selectAllV2Tabs)
    .pipe(
      take(1),
      switchMap((tabs) =>
        this.treeRefreshService.getTreeItemsOnlyRulesetsWithDatasetAttributes(ids.projectId!, ids.dataSetId!).pipe(
          take(1),
          switchMap(({ treeView, matchingDatasets }) => {
            const filteredTreeView = this.treeRefreshService.filterMatchingDatasetFromTreeData(
              matchingDatasets,
              treeView,
            );
            return this.modalService
              .open(TreeComponent, '', '400px', undefined, { treeView: filteredTreeView })
              .pipe(take(1));
          }),
          switchMap((modalRef: ModalRef<TreeComponent>) =>
            modalRef.getResult<{ selectedItem: MappedItem }>().pipe(filter((res) => res !== undefined)),
          ),
          map((res) => ({ tabs, res })),
          take(1),
        ),
      ),
    )
    .subscribe(({ res, tabs }) => {
      // Determine the key for the TARGET ruleset chosen in the modal
      const targetIds = res.selectedItem.ids;
      const targetKey = generateNgrxKey(targetIds.projectId!, targetIds.dataSetId!, targetIds.ruleSetId!, 0, 'ruleSet');

      // The key for the SOURCE ruleset was passed into this method as 'currentTableKey'.

      const isTargetTabAlreadyOpen = tabs.some((tab) => isRuleSetV2(tab.id) && tab.id === targetKey);

      if (isTargetTabAlreadyOpen) {
        // Dispatch when the target tab is already open
        this.store.dispatch(
          V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsAlreadyOpened({
            targetNgrxKey: targetKey,
            targetIds,
            currentTableRowsUuids: selectedRowsUuids,
            sourceTableKey: currentTableKey,
          }),
        );
      } else {
        // Dispatch when the target tab is closed. We provide all properties to satisfy the action's type definition.
        this.store.dispatch(
          V2RulesTableActions.copyRowsFromCurrentTableToAnotherTableThatIsClosed({
            targetNgrxKey: targetKey, // Added back to fix TS error
            targetIds: targetIds,   // Added back to fix TS error
            selectedItem: res.selectedItem,
            currentTableRowsUuids: selectedRowsUuids,
            sourceTableKey: currentTableKey,
          }),
        );
      }
    });
}




  // private copyRulesToRuleSetThatIsNotOpen(
  //   targetRulesetTabId: string,
  //   targetIds: Ids,
  //   selectedItem: MappedItem,
  //   datasetText: string,
  //   currentTableRowsUuids: Set<string>,
  //   currentTableKey: string,
  // ): void {
    // this.treeRefreshService.openRuleSetTab(targetIds, selectedItem.text, datasetText);
    // //TODO: This is a hack. We should wait for new rule set tab to load big table and then copy rules
    // //On slower connections this will not work :C
    // //unfortunately we do not know when big table is loaded
    // //once new entity store is implemented this should not be a problem
    // setTimeout(() => {
    //   this.store.dispatch(V2TabsActions.setIsSaved({ isSaved: false }));
    //   this.refreshService.setRefreshForAllTables(targetIds);
    //   const anotherV2TableKey = targetRulesetTabId;
    //   this.store.dispatch(
    //     V2RulesTableActions.copyRowsFromCurrentTableToAnotherTable({
    //       anotherV2TableKey,
    //       currentTableRowsUuids,
    //       currentTableKey,
    //     }),
    //   );
    //   setTimeout(async () => {
    //     await this.refreshService.updateAllRulesTabData(targetIds);
    //   }, 500);
    // }, 4000);
  // }
}
