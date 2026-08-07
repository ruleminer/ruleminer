import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { isRuleSetGroup, RolapItemTypes } from "../../../store/v2Tabs/utils";
import { ActionItem } from "../../models/action-item.model";
import { BaseIconsActionService } from "../base-icons-action.service";
import { MappedItem } from "../../../../main/project/dataset/models/treeview";
import { RulesetsGroupActionSet, RulesetsGroupActionType } from "../../../../main/project/dataset/treeview/service/tree-item-actions.types";
import { TranslateResponse } from "../../../../main/project/dataset/treeview/tree-item/tree-item.types";
import { ContextMenuItem } from "../../../interfaces/context-menu.model";
import { ProjectGenerateRuleSetModalComponent } from "../../../../main/project/project-rules/modals/project-generate-rule-set-modal/project-generate-rule-set-modal.component";
import { ModalPositions } from "../../../services/modal/modal.service";
import { Ids } from "../../../store/ruleSets/rulesets.selectors";

/**
 * Provides specific actions applicable to 'Ruleset Group' type.
 * Implements `currentIconActions$` based on selected ruleset IDs and tab context.
 */
@Injectable({
    providedIn: 'root',
})
export class RulesetGroupIconsActionService extends BaseIconsActionService {

    override itemType: RolapItemTypes = 'rulesets_group';
    
    override currentIconActions$: Observable<ActionItem[]> = of([]);

      private readonly actionTranslationKeys = {
          [RulesetsGroupActionType.GENERATE]: 'project.treeview.context_menu.button.download',
          [RulesetsGroupActionType.COMPARE]: 'project.treeview.context_menu.button.edit',
      };

    override getContextMenuItems(res: TranslateResponse, item: MappedItem): Observable<ContextMenuItem[]> {
        const isGenerateDisabled = this.isRulesetGroupGenerateDisabled(item);
        return of([
            { text: res.treeview.context_menu.button.generate, type: RulesetsGroupActionType.GENERATE, disabled: isGenerateDisabled },
            { text: res.treeview.context_menu.button.compare, type: RulesetsGroupActionType.COMPARE },
        ]);
    }

     public getActions(): RulesetsGroupActionSet {
        return {
            [RulesetsGroupActionType.GENERATE]: {
                execute:(ids: Ids, name: string) => this.openGenerateRulesetModal(ids.projectId!, ids.dataSetId!, name),
                translationKey: this.actionTranslationKeys[RulesetsGroupActionType.GENERATE]
            },
            [RulesetsGroupActionType.COMPARE]: {
                execute: (ids: Ids) => this.openCompareTab(ids),
                translationKey: this.actionTranslationKeys[RulesetsGroupActionType.COMPARE]
            }
        };
    }

        public openCompareTab(ids: Ids): void {
        this.treeRefreshService.openCompareTab(ids, this.translate.instant('compare.tab_name'));
    }

        public openGenerateRulesetModal(projectId: number, dataSetId: number, dataSetName: string): void {
            this.modalService.open(
                ProjectGenerateRuleSetModalComponent,
                'project.rules.add_new_modal.title_generate',
                '70%',
                '90%',
                {
                    ids: { projectId, dataSetId },
                    dataSetName,
                    closeOnBackdropClick: true,
                    position: ModalPositions.CENTER,
                    closeOnEscapeClick: false,
                },
            );
        }
  
    
    /**
     * Checks if GENERATE is disabled for ruleset group.
     * @param item The MappedItem.
     * @returns True if adding a ruleset is disabled, false otherwise.
     */
    public isRulesetGroupGenerateDisabled(item: MappedItem): boolean {
      if (!item?.items) {
        return false;
      }
        const isGenerateDisabled = isRuleSetGroup(item.type!) && item.limitReached;
         return isGenerateDisabled || false
        }

}