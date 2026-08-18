import { Injectable } from "@angular/core";
import { concatMap, filter, mergeMap, Observable, of, take } from "rxjs";
import { isReportGroup, RolapItemTypes } from "../../../store/v2Tabs/utils";
import { ActionItem } from "../../models/action-item.model";
import { BaseIconsActionService } from "../base-icons-action.service";
import { MappedItem } from "../../../../main/project/dataset/models/treeview";
import { ReportsGroupActionSet, ReportsGroupActionType } from "../../../../main/project/dataset/treeview/service/tree-item-actions.types";
import { TranslateResponse } from "../../../../main/project/dataset/treeview/tree-item/tree-item.types";
import { ContextMenuItem } from "../../../interfaces/context-menu.model";
import { GenerateReportsComponent } from "../../../../main/project/dataset/treeview/modals/generate-reports/generate-reports.component";
import { ModalRef } from "../../../services/modal/modal-ref";
import { activeProjectSelector } from "../../../store/project/project.selectors";
import { Ids } from "../../../store/ruleSets/rulesets.selectors";
import { filterOutNullish } from "../../../utils/rxjsUtils";
import { select } from "@ngrx/store";

/**
 * Provides specific actions applicable to 'Report Group' type.
 * Implements `currentIconActions$` based on selected ruleset IDs and tab context.
 */
@Injectable({
    providedIn: 'root',
})
export class ReportGroupIconsActionService extends BaseIconsActionService {

    override itemType: RolapItemTypes = 'rulesets_group';
    
    override currentIconActions$: Observable<ActionItem[]> = of([]);

    override getContextMenuItems(res: TranslateResponse, item: MappedItem): Observable<ContextMenuItem[]> {
            const isGenerateDisabled = isReportGroup(item.type!) && item.limitReached;
    
            return of([
                {
                    text: res.treeview.context_menu.button.generate_reports,
                    type: ReportsGroupActionType.GENERATE_REPORTS,
                    disabled: isGenerateDisabled,
                },
            ]);
  }
  
  public getActions(): ReportsGroupActionSet {
        return {
            [ReportsGroupActionType.GENERATE_REPORTS]: {
                execute: (ids: Ids, name: string) => this.openGenerateReportsModal(ids, name),
                translationKey: 'project.treeview.context_menu.button.generate'
            }
        };
    }

        public openGenerateReportsModal(ids: Ids, itemName: string): void {
        const name = itemName;
        const modal$ = this.store
            .pipe(
                select(activeProjectSelector),
                filterOutNullish(),
                select('type_of_problem'),
                take(1),
                mergeMap((typeOfProblem) => {
                    return this.modalService.open(
                        GenerateReportsComponent,
                        'project.treeview.context_menu.modal.generate_reports.header',
                        '70%',
                        'auto',
                        {
                            projectId: ids.projectId,
                            dataSetId: ids.dataSetId,
                            typeOfProblem: typeOfProblem?.toString() ?? 'UNKNOWN',
                            ruleSetId:  null, 
                            type: this.itemType,
                            name,
                        },
                    );
                }),
                concatMap((modalRef: ModalRef<GenerateReportsComponent>) => modalRef.getResult().pipe(filter(res => !!res))),
                take(1)
            );

        modal$.pipe(take(1)).subscribe((response: any) => {
            if ((response?.task_id ?? 0) > 0) this.openProcessListModal(ids.projectId!);
        });
        }
    

}