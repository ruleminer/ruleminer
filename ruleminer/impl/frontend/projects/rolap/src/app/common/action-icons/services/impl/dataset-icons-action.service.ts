import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../../utils/rxjsUtils';
import { Observable, combineLatest, concatMap, filter, map, mergeMap, of, switchMap, take } from 'rxjs';

import {
  faChartBar,
  faCopy,
  faEdit,
  faFileImport,
  faObjectGroup,
  faPlusSquare,
  faTrash,
  faWandMagicSparkles,
} from '@fortawesome/pro-regular-svg-icons';
import { select } from '@ngrx/store';

import { MappedItem } from '../../../../main/project/dataset/models/treeview';
import { GenerateReportsComponent } from '../../../../main/project/dataset/treeview/modals/generate-reports/generate-reports.component';
import { SplitComponent } from '../../../../main/project/dataset/treeview/modals/split/split.component';
import {
  DatasetActionSet,
  DatasetActionType,
} from '../../../../main/project/dataset/treeview/service/tree-item-actions.types';
import { TranslateResponse } from '../../../../main/project/dataset/treeview/tree-item/tree-item.types';
import { AddRulesetModalComponent } from '../../../../main/project/project-rules/modals/add-ruleset-modal/add-ruleset-modal.component';
import { ImportRulesetModalComponent } from '../../../../main/project/project-rules/modals/import-ruleset-modal/import-ruleset-modal.component';
import { ProjectGenerateRuleSetModalComponent } from '../../../../main/project/project-rules/modals/project-generate-rule-set-modal/project-generate-rule-set-modal.component';
import { ContextMenuItem } from '../../../interfaces/context-menu.model';
import { ModalRef } from '../../../services/modal/modal-ref';
import { ModalPositions } from '../../../services/modal/modal.service';
import { activeProjectSelector } from '../../../store/project/project.selectors';
import { Ids } from '../../../store/ruleSets/rulesets.selectors';
import { RolapItemTypes } from '../../../store/v2Tabs/utils';
import { ActionItem } from '../../models/action-item.model';
import { BaseIconsActionService } from '../base-icons-action.service';
import { TabActionCalledBy } from '../base-icons-action.service';
import { getCurrentV2DataSetTableFilterLength } from '../../../store/v2DataSetTable/v2DataSetTable.selectors';

@Injectable({
  providedIn: 'root',
})
export class DatasetIconsActionService extends BaseIconsActionService {
  override itemType: RolapItemTypes = 'dataSet';

  public readonly actionTranslationKeys: Record<DatasetActionType, string> = {
    [DatasetActionType.GENERATE]: 'project.treeview.context_menu.button.generate',
    [DatasetActionType.ADD_RULESET]: 'project.treeview.context_menu.button.add_ruleset',
    [DatasetActionType.IMPORT_RULESET]: 'project.treeview.context_menu.button.import',
    [DatasetActionType.GENERATE_REPORTS]: 'project.treeview.context_menu.button.generate_reports',
    [DatasetActionType.SPLIT]: 'project.treeview.context_menu.button.split',
    [DatasetActionType.DUPLICATE]: 'project.treeview.context_menu.button.duplicate',
    [DatasetActionType.EDIT]: 'project.treeview.context_menu.button.edit',
    [DatasetActionType.DELETE]: 'project.treeview.context_menu.button.delete',
  };

  public actionConfigs = [
    {
      type: DatasetActionType.GENERATE,
      icon: faWandMagicSparkles,
      translationKey: this.actionTranslationKeys[DatasetActionType.GENERATE],
    },
    {
      type: DatasetActionType.ADD_RULESET,
      icon: faPlusSquare,
      translationKey: this.actionTranslationKeys[DatasetActionType.ADD_RULESET],
    },
    {
      type: DatasetActionType.IMPORT_RULESET,
      icon: faFileImport,
      translationKey: this.actionTranslationKeys[DatasetActionType.IMPORT_RULESET],
    },
    {
      type: DatasetActionType.GENERATE_REPORTS,
      icon: faChartBar,
      translationKey: this.actionTranslationKeys[DatasetActionType.GENERATE_REPORTS],
    },
    {
      type: DatasetActionType.SPLIT,
      icon: faObjectGroup,
      translationKey: this.actionTranslationKeys[DatasetActionType.SPLIT],
    },
    {
      type: DatasetActionType.DUPLICATE,
      icon: faCopy,
      translationKey: this.actionTranslationKeys[DatasetActionType.DUPLICATE],
    },
    { type: DatasetActionType.EDIT, icon: faEdit, translationKey: this.actionTranslationKeys[DatasetActionType.EDIT] },

    {
      type: DatasetActionType.DELETE,
      icon: faTrash,
      translationKey: this.actionTranslationKeys[DatasetActionType.DELETE],
    },
  ];

  private filterLenghtSignal = this.store.selectSignal(getCurrentV2DataSetTableFilterLength);

  override currentIconActions$: Observable<ActionItem[]> = combineLatest([
    this.currentIds$,
    this.currentTabText$,
    this.isDatasetsLimitReached$,
    this.getCurrentMappedItem(),
  ]).pipe(
    map(([ids, tabName, isDatasetsLimitReached, currentItem]) => {
      const datasetActions = this.getActions();
      return this.actionConfigs
        .filter((config) => !!datasetActions[config.type])
        .map((config) => {
          const actionDef = datasetActions[config.type];
          return {
            icon: config.icon,
            title: actionDef.translationKey,
            action: () => actionDef.execute(ids, tabName),
            disabled: this._isActionDisabled(config.type, currentItem, isDatasetsLimitReached),
          };
        });
    }),
  );

  override getContextMenuItems(res: TranslateResponse, item: MappedItem): Observable<ContextMenuItem[]> {
    return this.isDatasetsLimitReached$.pipe(
      switchMap((isDatasetsLimitReached) => {
        let result: ContextMenuItem[];
        if (this.checkIfIsProjectItem(item)) {
          result = [];
        } else {
          const menuItems: ContextMenuItem[] = [
            { text: res.treeview.context_menu.button.delete, type: DatasetActionType.DELETE },
          ];

          if (!item.isDisabled) {
            menuItems.unshift(
              {
                text: res.treeview.context_menu.button.generate,
                type: DatasetActionType.GENERATE,
                disabled: this._isActionDisabled(DatasetActionType.GENERATE, item, isDatasetsLimitReached),
              },
              {
                text: res.treeview.context_menu.button.add_ruleset,
                type: DatasetActionType.ADD_RULESET,
                disabled: this._isActionDisabled(DatasetActionType.ADD_RULESET, item, isDatasetsLimitReached),
              },
              {
                text: res.treeview.context_menu.button.import,
                type: DatasetActionType.IMPORT_RULESET,
                disabled: this._isActionDisabled(DatasetActionType.IMPORT_RULESET, item, isDatasetsLimitReached),
              },
              {
                text: res.treeview.context_menu.button.generate_reports,
                type: DatasetActionType.GENERATE_REPORTS,
                disabled: this._isActionDisabled(DatasetActionType.GENERATE_REPORTS, item, isDatasetsLimitReached),
              },
              {
                text: res.treeview.context_menu.button.split,
                type: DatasetActionType.SPLIT,
                disabled: this._isActionDisabled(DatasetActionType.SPLIT, item, isDatasetsLimitReached),
              },
              {
                text: res.treeview.context_menu.button.duplicate,
                type: DatasetActionType.DUPLICATE,
                disabled: this._isActionDisabled(DatasetActionType.DUPLICATE, item, isDatasetsLimitReached),
              },
              {
                text: res.treeview.context_menu.button.edit,
                type: DatasetActionType.EDIT,
                disabled: this._isActionDisabled(DatasetActionType.EDIT, item, isDatasetsLimitReached),
              },
            );
          }
          result = menuItems;
        }
        return of(result);
      }),
    );
  }

  private _isActionDisabled(
    actionType: DatasetActionType,
    item: MappedItem | undefined,
    isDatasetsLimitReached: boolean,
  ): boolean {
    if (!item) return true;
    if (actionType !== DatasetActionType.DELETE && item.isDisabled) {
      return true;
    }

    switch (actionType) {
      case DatasetActionType.GENERATE:
      case DatasetActionType.ADD_RULESET:
      case DatasetActionType.IMPORT_RULESET:
        return this.isRulesetAddDisabled(item);

      case DatasetActionType.DUPLICATE:
      case DatasetActionType.SPLIT:
        return isDatasetsLimitReached;

      case DatasetActionType.GENERATE_REPORTS:
        return this.isReportGenerateDisabled(item);

      case DatasetActionType.EDIT:
      case DatasetActionType.DELETE:
      default:
        return false;
    }
  }

  public openGenerateRulesetModal(
    projectId: number,
    dataSetId: number,
    name: string
  ): void {
    this.modalService.open(
      ProjectGenerateRuleSetModalComponent,
      'project.rules.add_new_modal.title_generate',
      '70%',
      '90%',
      {
        ids: { projectId, dataSetId },
        dataSetName: name,
        closeOnBackdropClick: true,
        position: ModalPositions.CENTER,
        closeOnEscapeClick: false,
      },
    );
    if (this.calledBy === TabActionCalledBy.ToolBar && this.filterLenghtSignal() !== null) {
      const warning = this.translate.instant('project.rules.add_new_modal.generate_notification_info');
      this.notifyService.showNotify(
        warning,
        'warning',
        false,
        9000
      );
    }
  }
  

  public openAddRulesetModel(projectId: number, dataSetId: number, name: string): void {
    this.modalService.open(AddRulesetModalComponent, 'project.rules.add_existing_modal.title', '70%', 'auto', {
      projectId,
      dataSetId,
      name,
    });
  }

  public openImportRulesetModel(projectId: number, dataSetId: number): void {
    this.modalService.open(ImportRulesetModalComponent, 'project.rules.import_ruleset_modal.title', '70%', '90%', {
      projectId,
      dataSetId,
    });
  }

  public openGenerateReportsModal(ids: Ids, itemName: string): void {
    const modal$ = this.store.pipe(
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
            typeOfProblem: typeOfProblem,
            ruleSetId: null,
            type: this.itemType,
            name: itemName,
          },
        );
      }),
      concatMap((modalRef: ModalRef<GenerateReportsComponent>) => modalRef.getResult().pipe(filter((res) => !!res))),
      take(1),
    );

    modal$.subscribe((response: any) => {
      if ((response?.task_id ?? 0) > 0) {
        this.openProcessListModal(ids.projectId!);
      }
    });
  }

  public openSplitModal(ids: Ids, name: string): void {
    this.modalService.open(SplitComponent, 'project.treeview.context_menu.modal.train_test.title', '800px', undefined, {
      ids: ids,
      name: name,
    });
  }

  /**
   * Returns the action definitions in the DatasetActionSet format.
   * Provided for compatibility with components that expect this structure.
   */
  public getActions(): DatasetActionSet {
    const defaultName = 'Unknown Dataset';
    return {
      [DatasetActionType.GENERATE]: {
        execute: (ids: Ids, name: string = defaultName) =>
          this.openGenerateRulesetModal(ids.projectId!, ids.dataSetId!, name),
        translationKey: this.actionTranslationKeys[DatasetActionType.GENERATE],
      },
      [DatasetActionType.ADD_RULESET]: {
        execute: (ids: Ids, name: string = defaultName) =>
          this.openAddRulesetModel(ids.projectId!, ids.dataSetId!, name),
        translationKey: this.actionTranslationKeys[DatasetActionType.ADD_RULESET],
      },
      [DatasetActionType.IMPORT_RULESET]: {
        execute: (ids: Ids) => this.openImportRulesetModel(ids.projectId!, ids.dataSetId!),
        translationKey: this.actionTranslationKeys[DatasetActionType.IMPORT_RULESET],
      },
      [DatasetActionType.DUPLICATE]: {
        execute: (ids: Ids, name: string = defaultName) =>
          this.openDuplicateModalBase(ids, name, false),
        translationKey: this.actionTranslationKeys[DatasetActionType.DUPLICATE],
      },
      [DatasetActionType.EDIT]: {
        execute: (ids: Ids, name: string = defaultName) =>
          this.openRenameFormBase(ids, name),
        translationKey: this.actionTranslationKeys[DatasetActionType.EDIT],
      },
      [DatasetActionType.GENERATE_REPORTS]: {
        execute: (ids: Ids, name: string = defaultName) => this.openGenerateReportsModal(ids, name),
        translationKey: this.actionTranslationKeys[DatasetActionType.GENERATE_REPORTS],
      },
      [DatasetActionType.SPLIT]: {
        execute: (ids: Ids, name: string = defaultName) => this.openSplitModal(ids, name),
        translationKey: this.actionTranslationKeys[DatasetActionType.SPLIT],
      },
      [DatasetActionType.DELETE]: {
        execute: (ids: Ids) => this.openDeleteConfirmModalBase(ids),
        translationKey: this.actionTranslationKeys[DatasetActionType.DELETE],
      },
    };
  }
}
