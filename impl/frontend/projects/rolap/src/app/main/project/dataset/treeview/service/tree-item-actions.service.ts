import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ContextMenuItem } from 'projects/rolap/src/app/common/interfaces/context-menu.model';
import { RolapItemTypes } from '../../../../../common/store/v2Tabs/utils';
import { MappedItem } from '../../models/treeview';
import { DatasetIconsActionService } from '../../../../../common/action-icons/services/impl/dataset-icons-action.service';
import { RulesetIconsActionService } from '../../../../../common/action-icons/services/impl/ruleset-icons-action.service';
import { ReportIconsActionService } from '../../../../../common/action-icons/services/impl/report-icons-action.service';
import { RulesetGroupIconsActionService } from '../../../../../common/action-icons/services/impl/ruleset-group-action.service';
import { ReportGroupIconsActionService } from '../../../../../common/action-icons/services/impl/report-group-action.service';
import { AllActionTypes, AnyActionSet } from './tree-item-actions.types';
import { TranslateResponse } from '../tree-item/tree-item.types'; 
import { TabActionCalledBy } from '../../../../../common/action-icons/services/base-icons-action.service';

/**
 * Facade service for handling actions and context menu items related to tree view items.
 * It delegates calls to specific action services based on the item type,
 * simplifying dependencies for TreeItemComponent.
 */
@Injectable({
    providedIn: 'root'
})
export class TreeItemActionService {
    private datasetIconsActionService = inject(DatasetIconsActionService);
    private rulesetIconsActionService = inject(RulesetIconsActionService);
    private reportIconsActionService = inject(ReportIconsActionService);
    private rulesetGroupIconsActionService = inject(RulesetGroupIconsActionService);
    private reportGroupIconsActionService = inject(ReportGroupIconsActionService);

    /**
     * Retrieves the appropriate action set definition based on the tree item type.
     * @param itemType The type of the tree item.
     * @returns The corresponding action set, or undefined if none is found.
     */
    private getActionSet(itemType: RolapItemTypes): AnyActionSet | undefined {
        this.datasetIconsActionService.calledBy = TabActionCalledBy.TreeContextMenu;

        switch (itemType) {
            case 'dataSet': return this.datasetIconsActionService.getActions();
            case 'ruleSet': return this.rulesetIconsActionService.getActions();
            case 'report':
            case 'EDA':
            case 'WHITEBOX':
            case 'PREDICTION': return this.reportIconsActionService.getActions();
            case 'rulesets_group': return this.rulesetGroupIconsActionService.getActions();
            case 'reports_group': return this.reportGroupIconsActionService.getActions();
            default:
                 return undefined;
        }
    }

    /**
     * Gets the observable list of context menu items for a given tree item type.
     * @param itemType The type of the tree item.
     * @param simpleRes The translation object required by the underlying action services.
     * @param item The tree item.
     * @returns An observable emitting an array of ContextMenuItem objects.
     */
    getContextMenuItems(
        itemType: RolapItemTypes,
        simpleRes: TranslateResponse, 
        item: MappedItem
    ): Observable<ContextMenuItem[]> {
        switch (itemType) {
            case 'dataSet':
                return this.datasetIconsActionService.getContextMenuItems(simpleRes, item);
            case 'ruleSet':
                return this.rulesetIconsActionService.getContextMenuItems(simpleRes, item);
            case 'report':
            case 'EDA':
            case 'WHITEBOX':
            case 'PREDICTION':
                return this.reportIconsActionService.getContextMenuItems(simpleRes, item);
            case 'rulesets_group':
                return this.rulesetGroupIconsActionService.getContextMenuItems(simpleRes, item);
            case 'reports_group':
                return this.reportGroupIconsActionService.getContextMenuItems(simpleRes, item);
            default:
                 return of([]);
        }
    }

    /**
     * Executes a specific action.
     * @param itemType The type of the tree item.
     * @param actionType The type of action to execute (key within the action set).
     * @param ids The IDs associated with the tree item.
     * @param text The display text of the tree item.
     */
    executeAction(
        itemType: RolapItemTypes,
        actionType: AllActionTypes,
        ids: MappedItem['ids'],
        text: string
    ): void {
        const actionSet = this.getActionSet(itemType);

        if (!(actionSet &&
            typeof actionType === 'string' &&
            actionType in actionSet &&
            typeof (actionSet as any)[actionType]?.execute === 'function'))
        {
            throw new Error(`Action '${actionType}' not found or not executable for item type '${itemType}'.`);
        }

        try {
            (actionSet as any)[actionType].execute(ids, text);
        } catch (error) {
            throw new Error(`Error executing action '${actionType}' for item type '${itemType}':`);
        }
    }
}
