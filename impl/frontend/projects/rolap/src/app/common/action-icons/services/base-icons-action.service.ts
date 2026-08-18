import { Injectable, inject } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, EMPTY, combineLatest } from 'rxjs';
import { mergeMap, filter, take, map, distinctUntilChanged } from 'rxjs/operators';


import { ModalService } from '../../services/modal/modal.service';
import { ModalRef } from '../../services/modal/modal-ref';
import { TreeviewRefreshService } from '../../../main/project/dataset/treeview/service/treeview-refresh.service';
import { AppState } from '../../store/app-state.model';
import { ActionItem } from '../models/action-item.model';
import { Ids } from '../../store/ruleSets/rulesets.selectors';
import { RolapItemTypes, isDataSet, isEdaWhiteOrBoxOrPrediction, isReportGroup, isRuleSetGroup } from '../../store/v2Tabs/utils';
import { MappedItem, TreeView } from '../../../main/project/dataset/models/treeview';
import { DuplicateComponent } from '../../../main/project/dataset/treeview/modals/duplicate/duplicate.component';
import { RenameComponent } from '../../../main/project/dataset/treeview/modals/rename/rename.component';
import { DeleteConfirmComponent } from '../../../main/project/dataset/treeview/modals/delete-confirm/delete-confirm.component';
import { mainLimitsSelector } from '../../store/limits/limits.selector';
import { selectCurrentV2TabIds, selectCurrentV2TabText } from '../../store/v2Tabs/v2Tabs.selectors';
import { filterOutNullish } from '../../utils/rxjsUtils';
import { TranslateResponse } from '../../../main/project/dataset/treeview/tree-item/tree-item.types';
import { ContextMenuItem } from '../../interfaces/context-menu.model';
import { TranslateService } from '@ngx-translate/core';
import { ProcessTabInfoComponent } from '../../../main/project/process/process-tab-info/process-tab-info.component';
import { TimerService } from '../../../main/project/process/services/timer.service';
import { selectTreeData } from '../../store/project/project.selectors';
import { NotifyService } from '../../services/notify/notify.service';
import { toSignal } from '@angular/core/rxjs-interop';

export enum TabActionCalledBy {
  ToolBar = 'ToolBar',
  TreeContextMenu = 'TreeContextMenu',
}

/**
 * Abstract base class for providing context-specific actions for an icon bar.
 * Provides common dependencies and utility methods for opening standard modals
 * (Duplicate, Rename, Delete) and handling tree refreshes.
 * Subclasses must implement the specific logic for generating their actions (`currentIconActions$`)
 * and define their specific item type (`itemType`).
 */
@Injectable()
export abstract class BaseIconsActionService {
  protected store = inject(Store<AppState>);
  protected modalService = inject(ModalService);
  protected treeRefreshService = inject(TreeviewRefreshService);
  protected translate = inject(TranslateService)
  protected timerService = inject(TimerService);
  protected notifyService = inject(NotifyService);

  public calledBy: TabActionCalledBy;

  /**
   * The specific type of item this action service pertains to (e.g., 'dataSet', 'ruleSet').
   * Must be implemented by subclasses.
   */
  protected abstract itemType: RolapItemTypes;

  /**
   * An observable emitting the array of currently available actions based on the context.
   * Must be implemented by subclasses.
   */
  abstract currentIconActions$: Observable<ActionItem[]>;

  protected currentIds$ = this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish())
  protected mainLimits$ = this.store.select(mainLimitsSelector).pipe(filterOutNullish());
  protected currentTabText$ = this.store.pipe(select(selectCurrentV2TabText), filterOutNullish())
  protected treeDataSignal = toSignal(this.store.select(selectTreeData).pipe(filterOutNullish()));
  
   /**
   * An observable emitting the MappedItem corresponding to the currently selected IDs in the store.
   * It combines the latest IDs and the latest tree data, then searches the tree.
   * Emits `undefined` if no matching item is found or if data is unavailable.
   */
  protected getCurrentMappedItem(): Observable<MappedItem | undefined> {
    return combineLatest([
        this.currentIds$,
        this.store.select(selectTreeData).pipe(filterOutNullish())
    ]).pipe(
      map(([currentIds, treeViewData]) => {
            if (!treeViewData || treeViewData.length === 0) {
                return undefined;
            }
            const rootItems = treeViewData[0]?.items;
            return this.findItemByIds(rootItems, currentIds);
        }),
        distinctUntilChanged()
    );
  }

  /**
 * Searches for a MappedItem by IDs.
 * @param items The array of MappedItems to search within.
 * @param targetIds The Ids object to match against.
 * @returns The found MappedItem or undefined if not found.
 */
public findItemByIds(items: MappedItem[] | undefined, targetIds: Ids): MappedItem | undefined {
  return this.findItemInTreeRecursively(items, item => this.compareIds(item.ids, targetIds));
}

/**
 * Searches for a MappedItem by ID.
 * @param id The ID to search for.
 * @param treeData The MappedItem array representing the tree.
 * @returns The found MappedItem or undefined if not found.
 */
public findMappedItemById(id: string | number | undefined, treeData: MappedItem[] | undefined): MappedItem | undefined {
  if (id === undefined) return undefined;
  return this.findItemInTreeRecursively(treeData, item => item.id === id);
}

 

  /**
 * Recursively searches an array of MappedItems for an item matching the provided predicate function.
 * @param items The array of MappedItems to search within.
 * @param matchFn The function that determines if an item matches the search criteria.
 * @returns The found MappedItem or undefined if not found.
 */
private findItemInTreeRecursively(
  items: MappedItem[] | undefined, 
  matchFn: (item: MappedItem) => boolean
): MappedItem | undefined {
  if (!items) return undefined;

  for (const item of items) {
    if (matchFn(item)) return item;
    
    const foundInChildren = this.findItemInTreeRecursively(item.items, matchFn);
    if (foundInChildren) return foundInChildren;
  }

  return undefined;
}


  /**
   * Compares two Ids objects for equality, handling potentially missing IDs.
   * It treats `undefined`, `null`, and `0` as equivalent for 'not specified' IDs
   * when comparing `ruleSetId` and `reportId`.
   * @param itemIds The IDs of the item being checked in the tree.
   * @param targetIds The IDs from the current selection (store).
   * @returns True if the IDs are considered a match for selection purposes, false otherwise.
   */
  private compareIds(itemIds: Ids, targetIds: Ids): boolean {
    // Project ID must always match exactly
    if (itemIds.projectId !== targetIds.projectId) {
        return false;
    }

    // DataSet ID must match exactly if target has one (treat null/0 as not having one)
    if (targetIds.dataSetId != null && targetIds.dataSetId !== 0) {
        if (itemIds.dataSetId !== targetIds.dataSetId) {
            return false;
        }
    } else {
        // If target doesn't specify dataSetId, item shouldn't have one either
        if (itemIds.dataSetId != null && itemIds.dataSetId !== 0) {
             return false;
        }
    }

    // RuleSet ID comparison: Treat undefined/null/0 as equivalent "not specified"
    const itemRuleSetId = itemIds.ruleSetId ?? 0; 
    const targetRuleSetId = targetIds.ruleSetId ?? 0; 
    if(itemRuleSetId !== targetRuleSetId) {
        return false;
    }

    // Report ID comparison: Treat undefined/null/0 as equivalent "not specified"
    const itemReportId = itemIds.reportId ?? 0; 
    const targetReportId = targetIds.reportId ?? 0; 
     if(itemReportId !== targetReportId) {
        return false;
    }

    return true;
  }

  /**
   * Retrieves the context menu items for a given tree view item.
   * This method is intended to be implemented by subclasses or in specific contexts
   * to provide dynamic context menus based on the item's type and state.
   *
   * @param res An object containing translated text resources, likely used for the menu item labels.
   * @param item The MappedItem representing the tree view node for which to generate the context menu.
   * @returns An array of ContextMenuItem objects, each defining an item to be displayed in the context menu.
   * @throws {Error} If the method is called without being implemented.
   */
  public getContextMenuItems(res: TranslateResponse, item: MappedItem): Observable<ContextMenuItem[]> {
      throw new Error('Method not implemented')
  }

  public isDatasetsLimitReached$ = combineLatest([this.mainLimits$, this.store.select(selectTreeData)]).pipe(
            map(([limits, treeView]) => {
                if (!limits || !treeView || treeView.length === 0) {
                    return false;
                }
                
                const datasets = treeView[0]?.items?.filter(item => 
                    !!item.type && isDataSet(item.type)
                ) || [];
              const {max_datasets} = limits
  
                return datasets.length >= (max_datasets as number);
            }),
          );
  /**
   * Determines the translation key suffix based on the item type, used for modal titles/confirmations.
   * @param type The RolapItemType.
   * @param cloneRelated Optional flag specifically for duplicate actions.
   * @returns A string suffix for translation keys or null if type is unknown.
   */
  protected getTranslateType(type: RolapItemTypes, cloneRelated = false): string | null {
    if (type === 'dataSet') {
        return cloneRelated ? 'data_set_related' : 'data_set';
    }
    if (type === 'ruleSet') {
        return 'rule_set';
    }
    if (type === 'report' || isEdaWhiteOrBoxOrPrediction(type)) {
        return 'report';
    }
    throw new Error(`BaseIconsActionService: Unknown RolapItemType for translation key: ${type}`);
  }

  /**
   * Retrieves the current data structure representing the tree view.
   * Used primarily for delete confirmation modals.
   * Note: Assumes DeleteConfirmComponent expects a TreeView object. Adjust if needed.
   * @returns The current TreeView data.
   */
  protected getTreeData(): TreeView | null {
    return this.treeDataSignal() as TreeView;
  }




  /**
   * Opens the standard 'Duplicate' modal with common configuration.
   * Uses the `itemType` defined by the subclass.
   * @param ids The identifiers for the item being duplicated.
   * @param name The current name of the item.
   * @param cloneRelated Whether related items should also be cloned (applies mainly to datasets).
   * @returns An observable that emits the result of the modal upon closing, filtered for non-undefined values. Completes after one emission.
   */
  protected openDuplicateModalBase(ids: Ids, name: string, cloneRelated = false): Observable<any> {
    const translateType = this.getTranslateType(this.itemType, cloneRelated);
    if (!translateType) {
      throw new Error('BaseIconsActionService: Cannot determine translation type for duplicate modal.');
    }

    return this.modalService.open(
      DuplicateComponent,
      `project.treeview.context_menu.modal.duplicate.title_${translateType}`,
      '500px',
      undefined,
      {
        projectId: ids.projectId,
        dataSetId: ids.dataSetId,
        ruleSetId: ids.ruleSetId,
        reportId: ids.reportId,
        type: this.itemType,
        name,
        cloneRelated: cloneRelated,
      }
    ).pipe(
      mergeMap((modalRef: ModalRef<DuplicateComponent>) =>
        modalRef
          ? modalRef.getResult().pipe(filter(res => res !== undefined))
          : EMPTY
      ),
      take(1)
    );
  }

  /**
   * Opens the standard 'Rename' modal with common configuration.
   * Uses the `itemType` defined by the subclass.
   * @param ids The identifiers for the item being renamed.
   * @param name The current name of the item.
   * @returns An observable emitting `true` if the name was changed, `false` otherwise. Completes after one emission.
   */
  protected openRenameFormBase(ids: Ids, name: string): Observable<boolean> {
    return this.modalService.open(
      RenameComponent,
      'project.treeview.context_menu.modal.rename.title',
      '400px',
      undefined,
      {
        ids,
        type: this.itemType,
        name,
      }
    ).pipe(
      mergeMap((modalRef: ModalRef<RenameComponent>) =>
        modalRef
          ? modalRef.getResult().pipe(filter((res): res is boolean => res !== undefined))
          : EMPTY
      ),
      take(1)
    );
  }

  /**
   * Opens the standard 'Delete Confirmation' modal with common configuration.
   * Uses the `itemType` defined by the subclass and fetches current tree data.
   * @param ids The identifiers for the item being deleted.
   * @returns An observable emitting `true` if deletion was confirmed, `false` otherwise. Completes after one emission.
   */
  protected openDeleteConfirmModalBase(ids: Ids): Observable<boolean> {
    const translateType = this.getTranslateType(this.itemType);
    if (!translateType) {
      console.error('BaseIconsActionService: Cannot determine translation type for delete modal.');
      return EMPTY;
    }

    const treeData = this.getTreeData();
    if (!treeData) {
        console.error('BaseIconsActionService: Could not retrieve tree data for delete confirmation.');
        return EMPTY;
    }

    return this.modalService.open(
      DeleteConfirmComponent,
      `project.treeview.context_menu.modal.delete_confirm.${translateType}.title`,
      '400px',
      undefined,
      {
        ids,
        type: this.itemType,
        treeView: treeData
      }
    ).pipe(
      mergeMap((modalRef: ModalRef<DeleteConfirmComponent>) =>
        modalRef
          ? modalRef.getResult().pipe(filter((res): res is boolean => res !== undefined))
          : EMPTY
      ),
      take(1)
    );
  }

  /**
   * Checks if adding a ruleset is disabled. Returns true if the item has a 'ruleSetGroup' child with 'limitReached' set to true.
   * @param item The MappedItem.
   * @returns True if adding a ruleset is disabled, false otherwise.
   */
  public isRulesetAddDisabled(item: MappedItem): boolean {
    if (!item?.items) {
      return false;
    }
  
    const rulesetGroup = item.items.find(
      (childItem) => childItem.type && isRuleSetGroup(childItem.type)
    );
  
    return rulesetGroup?.limitReached ?? false;
  }
  

     protected checkIfIsProjectItem(item: MappedItem): boolean {
          return (
              typeof item.ids.projectId === 'number' &&
              !item.ids.dataSetId &&
              !item.ids.reportId &&
              !item.ids.ruleSetId
          );
  }
  
      /**
     * Checks if generating reports is disabled. Returns true if the item has a 'reportGroup' child with 'limitReached' set to true.
     * @param item The MappedItem (likely a Dataset).
     * @returns True if generating reports is disabled, false otherwise.
     */
    public isReportGenerateDisabled(item: MappedItem): boolean {
    if (!item?.items) {
        return false;
    }

    const reportGroup = item.items.find(
        (childItem) => childItem.type && isReportGroup(childItem.type)
    );

    return reportGroup?.limitReached ?? false;
  }
  
  protected openProcessListModal(projectId: number): void {
      this.modalService.open(ProcessTabInfoComponent, 'process.info_modal.title', '400px', undefined, {
          projectId,
      });
      this.timerService.refresh();
  }
}