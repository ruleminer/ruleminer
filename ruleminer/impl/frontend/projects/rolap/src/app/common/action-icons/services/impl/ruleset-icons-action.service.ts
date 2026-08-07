import { Injectable } from "@angular/core"; 
import { faFilter, faCopy, faEdit, faTrash } from "@fortawesome/pro-regular-svg-icons";
import { Observable, map, combineLatest, of } from "rxjs"; 
import { ActionItem } from "../../models/action-item.model";
import { RulesetActionSet, RulesetActionType } from "../../../../main/project/dataset/treeview/service/tree-item-actions.types";
import { BaseIconsActionService } from "../base-icons-action.service";
import { Ids } from "../../../store/ruleSets/rulesets.selectors";
import { isRuleSetGroup, RolapItemTypes } from "../../../store/v2Tabs/utils";
import { ModalPositions } from "../../../services/modal/modal.service";
import { FilterModalComponent } from '../../../../main/project/dataset/treeview/modals/filter-modal/filter-modal.component';
import { MappedItem } from "../../../../main/project/dataset/models/treeview";
import { ContextMenuItem } from "../../../interfaces/context-menu.model";
import { TranslateResponse } from "../../../../main/project/dataset/treeview/tree-item/tree-item.types";


/**
 * Provides specific actions applicable to 'Ruleset' tab type.
 * Implements `currentIconActions$` based on selected ruleset IDs and tab context,
 * including logic to disable the duplicate action based on item state and limits.
 */
@Injectable({
    providedIn: 'root',
})
export class RulesetIconsActionService extends BaseIconsActionService {

    override itemType: RolapItemTypes = 'ruleSet';

    private readonly actionTranslationKeys = {
        [RulesetActionType.FILTER]: 'project.treeview.context_menu.button.filter',
        [RulesetActionType.DUPLICATE]: 'project.treeview.context_menu.button.duplicate',
        [RulesetActionType.EDIT]: 'project.treeview.context_menu.button.edit',
        [RulesetActionType.DELETE]: 'project.treeview.context_menu.button.delete',
    };

    private readonly actionConfigs = [
        { type: RulesetActionType.FILTER, icon: faFilter, translationKey: this.actionTranslationKeys[RulesetActionType.FILTER] },
        { type: RulesetActionType.DUPLICATE, icon: faCopy, translationKey: this.actionTranslationKeys[RulesetActionType.DUPLICATE] },
        { type: RulesetActionType.EDIT, icon: faEdit, translationKey: this.actionTranslationKeys[RulesetActionType.EDIT] },
        { type: RulesetActionType.DELETE, icon: faTrash, translationKey: this.actionTranslationKeys[RulesetActionType.DELETE] }
    ];


    /**
     * Generates the context menu items specific to a ruleset item.
     * It adapts the logic from the original TreeItemComponent's setRuleSetContextMenuItems method,
     * leveraging the service's own helper methods like shouldDisableDuplicateRuleset.
     *
     * @param res An object containing translated text resources, used for the menu item labels.
     * @param item The MappedItem representing the ruleset tree view node.
     * @returns An array of ContextMenuItem objects defining the ruleset-specific context menu.
     */
    override getContextMenuItems(res: TranslateResponse, item: MappedItem): Observable<ContextMenuItem[]> {
        const isDuplicateDisabled = this.shouldDisableDuplicateRuleset(item);

        const menuItems: ContextMenuItem[] = [
            {
                text: res.treeview.context_menu.button.filter,
                type: RulesetActionType.FILTER
            },
            {
                text: res.treeview.context_menu.button.duplicate,
                type: RulesetActionType.DUPLICATE,
                disabled: isDuplicateDisabled
            },
            {
                text: res.treeview.context_menu.button.edit,
                type: RulesetActionType.EDIT
            },
            {
                text: res.treeview.context_menu.button.delete,
                type: RulesetActionType.DELETE
            }
        ];

        return of(menuItems);
    }

    /**
     * Returns the action definitions in the RulesetActionSet format.
     */
    public getActions(): RulesetActionSet {
        const defaultName = 'Unknown Ruleset';
        return {
            [RulesetActionType.FILTER]: {
                execute: (ids: Ids) => this.openFilterByAlgorithmModal(ids),
                translationKey: this.actionTranslationKeys[RulesetActionType.FILTER]
            },
            [RulesetActionType.DUPLICATE]: {
                execute: (ids: Ids, name?: string) => this.openDuplicateModalBase(ids, name || defaultName, false),
                translationKey: this.actionTranslationKeys[RulesetActionType.DUPLICATE]
            },
            [RulesetActionType.EDIT]: {
                execute: (ids: Ids, name?: string) => this.openRenameFormBase(ids, name || defaultName),
                translationKey: this.actionTranslationKeys[RulesetActionType.EDIT]
            },
            [RulesetActionType.DELETE]: {
                execute: (ids: Ids) => this.openDeleteConfirmModalBase(ids),
                translationKey: this.actionTranslationKeys[RulesetActionType.DELETE]
            }
        };
    }

    override currentIconActions$: Observable<ActionItem[]> = combineLatest([
        this.currentIds$,
        this.currentTabText$,
        this.getCurrentMappedItem()
    ]).pipe(
        map(([ids, tabName, currentItem]) => {

            return this.actionConfigs
                .map(config => {
                    let isDisabled = false; 
                    if (config.type === RulesetActionType.DUPLICATE) {
                        if (currentItem) {
                            isDisabled = this.shouldDisableDuplicateRuleset(currentItem);
                            
                        } else {
                            console.warn(`Could not find MappedItem for ruleSetId: ${ids.ruleSetId} to check duplicate status.`);
                            isDisabled = true;
                        }
                    }

                    return {
                        icon: config.icon,
                        title: config.translationKey,
                        action: () => this.executeAction(config.type, ids, tabName || 'Unknown Ruleset'),
                        disabled: isDisabled 
                    };
                });
        })
    );

    private executeAction(type: RulesetActionType, ids: Ids, name: string): void {
        switch (type) {
            case RulesetActionType.FILTER:
                this.openFilterByAlgorithmModal(ids);
                break;
            case RulesetActionType.DUPLICATE:
                this.openDuplicateModalBase(ids, name, false);
                break;
            case RulesetActionType.EDIT:
                this.openRenameFormBase(ids, name);
                break;
            case RulesetActionType.DELETE:
                this.openDeleteConfirmModalBase(ids);
                break;
            default:
                console.warn(`Unhandled RulesetActionType: ${type}`);
        }
    }

    private openFilterByAlgorithmModal(ids: Ids): void {
        this.modalService.open(FilterModalComponent, 'project.treeview.context_menu.modal.filter.title', '70%', '80%', {
            ids: {
                projectId: ids.projectId,
                dataSetId: ids.dataSetId,
                ruleSetId: ids.ruleSetId,
            },
            closeOnBackdropClick: true,
            position: ModalPositions.CENTER,
            closeOnEscapeClick: false,
        });
    }


    /**
     * Determines if the duplicate action for a ruleset should be disabled.
     * Checks item's own disabled status and parent group limits.
     * @param item The MappedItem corresponding to the ruleset.
     * @returns {boolean} True if the duplicate action should be disabled, false otherwise.
     */
    public shouldDisableDuplicateRuleset(item: MappedItem): boolean {
        const isItemDisabled = item.isDisabled || false;
        const treeView = this.treeDataSignal() 
        const parentDataset = this.findMappedItemById(item.ids.dataSetId, treeView); 
        const parentRulesetGroup = parentDataset?.items?.find(child => child.type && isRuleSetGroup(child.type));
        const isGroupLimitReached = parentRulesetGroup?.limitReached ?? false;
        return isItemDisabled || isGroupLimitReached;
    }

}