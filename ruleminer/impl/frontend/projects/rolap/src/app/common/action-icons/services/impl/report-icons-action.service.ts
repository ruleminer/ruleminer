import { inject, Injectable } from "@angular/core";
import { select } from "@ngrx/store";
import { faDownload, faEdit, faTrash } from "@fortawesome/pro-regular-svg-icons";
import { Observable, map, combineLatest, take, of } from "rxjs";

import { selectCurrentV2TabIds, selectCurrentV2TabText } from "../../../store/v2Tabs/v2Tabs.selectors";
import { filterOutNullish } from "../../../utils/rxjsUtils";
import { ActionItem } from "../../models/action-item.model";
import { ReportActionSet, ReportActionType } from "../../../../main/project/dataset/treeview/service/tree-item-actions.types";
import { BaseIconsActionService } from "../base-icons-action.service";
import { Ids } from "../../../store/ruleSets/rulesets.selectors";
import { RolapItemTypes } from "../../../store/v2Tabs/utils";
import { ReportService } from "../../../../main/project/service/report.service"; 
import { Exporter } from "../../../utils/exportUtils"; 
import { MappedItem } from "../../../../main/project/dataset/models/treeview";
import { ContextMenuItem } from "../../../interfaces/context-menu.model";
import { TranslateResponse } from "../../../../main/project/dataset/treeview/tree-item/tree-item.types";

/**
 * Provides specific actions applicable to 'Report' tab type.
 * Implements `currentIconActions$` based on selected report IDs and tab context.
 */
@Injectable({
    providedIn: 'root',
})
export class ReportIconsActionService extends BaseIconsActionService {
  override itemType: RolapItemTypes = 'report';

  private reportService = inject(ReportService);

  private readonly actionTranslationKeys = {
      [ReportActionType.DOWNLOAD_REPORT]: 'project.treeview.context_menu.button.download',
      [ReportActionType.EDIT]: 'project.treeview.context_menu.button.edit',
      [ReportActionType.DELETE]: 'project.treeview.context_menu.button.delete',
  };

  private readonly actionConfigs = [
      { type: ReportActionType.DOWNLOAD_REPORT, icon: faDownload, translationKey: this.actionTranslationKeys[ReportActionType.DOWNLOAD_REPORT] },
      { type: ReportActionType.EDIT, icon: faEdit, translationKey: this.actionTranslationKeys[ReportActionType.EDIT] },
      { type: ReportActionType.DELETE, icon: faTrash, translationKey: this.actionTranslationKeys[ReportActionType.DELETE] }
  ];


  override currentIconActions$: Observable<ActionItem[]> = combineLatest([
      this.store.pipe(select(selectCurrentV2TabIds), filterOutNullish()),
      this.store.pipe(select(selectCurrentV2TabText), filterOutNullish())
  ]).pipe(
      map(([ids, tabName]) => {
          return this.actionConfigs
              .map(config => {
                  return {
                      icon: config.icon,
                      title: config.translationKey,
                      action: () => this.executeAction(config.type, ids, tabName || 'Unknown Report'),
                      disabled: false
                  };
              });
      })
  );

  public executeAction(type: ReportActionType, ids: Ids, name: string): void {
      switch (type) {
          case ReportActionType.DOWNLOAD_REPORT:
              this.downloadReport(ids, name);
              break;
          case ReportActionType.EDIT:
              this.openRenameFormBase(ids, name);
              break;
          case ReportActionType.DELETE:
              this.openDeleteConfirmModalBase(ids);
              break;
          default:
              throw new Error(`Unhandled ReportActionType: ${type}`);
      }
  }

  /**
   * Downloads the content of the specified report.
   * @param ids Must contain reportId.
   * @param name The name to use for the downloaded file.
   */
   public downloadReport(ids: Ids, name: string): void {
      if (!ids.reportId) {
          console.error("Report ID is required for download.");
          return;
      }
      const download$ = this.reportService.getReportFrameSrcDoc(ids.reportId).pipe(take(1));

      const processDownload = (srcDoc: string) => {
          Exporter.downloadReport(srcDoc, `${name}.html`);
      };

     download$.subscribe(processDownload);
  }

  /**
   * Returns the action definitions in the ReportActionSet format.
   */
  public getActions(): ReportActionSet {
      const defaultName = 'Unknown Report';
      return {
          [ReportActionType.DOWNLOAD_REPORT]: {
              execute: (ids: Ids, name: string = defaultName) => this.downloadReport(ids, name),
              translationKey: this.actionTranslationKeys[ReportActionType.DOWNLOAD_REPORT]
          },
          [ReportActionType.EDIT]: {
              execute: (ids: Ids, name: string = defaultName) => this.openRenameFormBase(ids, name),
              translationKey: this.actionTranslationKeys[ReportActionType.EDIT]
          },
          [ReportActionType.DELETE]: {
              execute: (ids: Ids) => this.openDeleteConfirmModalBase(ids),
              translationKey: this.actionTranslationKeys[ReportActionType.DELETE]
          }
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override getContextMenuItems(res: TranslateResponse, item: MappedItem): Observable<ContextMenuItem[]> {
        return of([
            { text: res.treeview.context_menu.button.download, type: ReportActionType.DOWNLOAD_REPORT },
            { text: res.treeview.context_menu.button.edit, type: ReportActionType.EDIT },
            { text: res.treeview.context_menu.button.delete, type: ReportActionType.DELETE },
        ]);
    }
    

}