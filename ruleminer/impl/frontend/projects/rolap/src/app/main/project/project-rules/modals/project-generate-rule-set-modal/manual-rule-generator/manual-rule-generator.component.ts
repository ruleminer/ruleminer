import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';

import { Subject, catchError, filter, map, mergeMap, switchMap, takeUntil, withLatestFrom } from 'rxjs';

import { faPen, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { cloneDeep, uniqBy } from 'lodash';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import { v4 as uuidv4 } from 'uuid';

import { Modal } from '../../../../../../common/services/modal/modal';
import { ModalRef } from '../../../../../../common/services/modal/modal-ref';
import { ModalPositions, ModalService } from '../../../../../../common/services/modal/modal.service';
import { AppState } from '../../../../../../common/store/app-state.model';
import {
  activeProjectProblemTypeSelector,
  activeProjectSelector,
} from '../../../../../../common/store/project/project.selectors';
import { removeIfAndThenFromRule } from '../../../../../../common/store/ruleSets/rulesets.reducer';
import { V2RulesTableMeta } from '../../../../../../common/store/v2RulesTable/types';
import { makeDisplayConclusionValue } from '../../../../../../common/store/v2RulesTable/utils';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { MappedItem, TreeView } from '../../../../dataset/models/treeview';
import { DatasetService } from '../../../../dataset/service/dataset.service';
import { TreeviewRefreshService } from '../../../../dataset/treeview/service/treeview-refresh.service';
import { RulesTableRow } from '../../../../models/project';
import { Rule } from '../../../../models/ruleset';
import { DataField } from '../../../../service/models/rules-customize-columns-api';
import { ProjectRulesTableEditorComponent } from '../../../project-rules-table/project-rules-table-editor/project-rules-table-editor.component';
import {
  RulesEditorDisplayTypes,
  RulesTableEditorModalSettings,
} from '../../../project-rules-table/project-rules-table-editor/types/rules-editor';
import { TreeComponent } from '../tree/tree.component';
import { ManualSelectRuleComponent } from './manual-select-rule/manual-select-rule/manual-select-rule.component';
import { ManualRuleSelectIds } from './manual-select-rule/models';
import { updatedAttributesIndicesForRule } from './utils';

@Component({
  selector: 'rolap-manual-rule-generator',
  templateUrl: './manual-rule-generator.component.html',
  styleUrls: ['./manual-rule-generator.component.scss'],
})
export class ManualRuleGeneratorComponent implements OnInit, OnDestroy {
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

  @Input() ruleSetId: number;
  @Input() dataSetId: number;
  @Input() decisionAttributeName: string | undefined;
  @Input() isRuleTable = false;

  @Output() dataSourceChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() ruleList: EventEmitter<Rule[]> = new EventEmitter<Rule[]>();
  @Output() currentSelectItemEmitter: EventEmitter<{ dataSetId: number; ruleSetId: number }> = new EventEmitter<{
    dataSetId: number;
    ruleSetId: number;
  }>();

  public faTrash = faTrash;
  public faPen = faPen;
  public treeView: TreeView;
  public selectedRulesList: Rule[] = [];
  public arrayStore: ArrayStore;
  public dataSource: DataSource;
  public hasMatchingTree = false;
  private autoIncrementValue = 1;
  private attributes: string[];
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private modalService: ModalService,
    private treeRefreshService: TreeviewRefreshService,
    private datasetService: DatasetService,
    private modal: Modal<ManualRuleGeneratorComponent>,
    private store: Store<AppState>,
  ) {}

  ngOnInit() {
    this.setCustomModalText();
    //TODO: Dodając nową regułę do zbioru nalezy brac atrubuty ze store selectCurrentAttributes
    // ale przy generowaniu nowego zbioru trzeba z backendu (getAttributesForDataset).
    this.datasetService
      .getAttributesForDataset(this.dataSetId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        if (!data) return;
        this.decisionAttributeName = data.find((item) => item.role === 'class')?.name;
        this.attributes = data.filter((item) => item.name !== this.decisionAttributeName).map((item) => item.name);
      });
    this.setMatchingTree();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setDataSource() {
    this.selectedRulesList = uniqBy(this.selectedRulesList, DataField.Uuid);
    this.selectedRulesList = this.selectedRulesList.map((row, i) => {
      return {
        ...row,
        autoIncrement: i + 1,
      };
    });
    this.ruleList.emit(this.selectedRulesList);
    this.arrayStore = new ArrayStore({
      data: this.selectedRulesList,
      key: DataField.Uuid,
      onRemoving: (uuid) => {
        this.selectedRulesList = this.selectedRulesList.filter((item) => item.uuid !== uuid);
        this.setDataSource();
      },
    });

    this.dataSource = new DataSource({
      reshapeOnPush: true,
      store: this.arrayStore,
      paginate: true,
    });
  }

  public showDataset(): void {
    this.modalService
      .open(TreeComponent, 'project.rules.select_ruleset', '400px', undefined, { treeView: cloneDeep(this.treeView) })
      .pipe(
        switchMap((modalRef: ModalRef<TreeComponent>) =>
          modalRef.getResult<{ selectedItem: MappedItem }>().pipe(
            filter((res) => res !== undefined),
            mergeMap((res) => {
              const selectedItemIds = res.selectedItem.ids;
              const ruleSetId = selectedItemIds.ruleSetId!;
              const dataSetId = selectedItemIds.dataSetId!;
              const currentSelectItemFromTreeView = { dataSetId, ruleSetId };
              this.currentSelectItemEmitter.emit(currentSelectItemFromTreeView);

              const manualRuleSelectIds: ManualRuleSelectIds = {
                ruleSetId,
                dataSetIds: {
                  original: dataSetId,
                  current: this.dataSetId,
                },
              };

              return this.modalService
                .open(ManualSelectRuleComponent, 'project.rules.select_rules', '900px', undefined, {
                  manualRuleSelectIds,
                })
                .pipe(
                  switchMap((manualRef: ModalRef<ManualSelectRuleComponent>) =>
                    manualRef
                      .getResult<{ items: any[]; meta: V2RulesTableMeta }>()
                      .pipe(filter((res) => res !== undefined)),
                  ),
                  withLatestFrom(this.store.select(activeProjectProblemTypeSelector)),
                  takeUntil(this.ngUnsubscribe),
                );
            }),
          ),
        ),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(([res, problemType]) => {
        if (res) this.setShowConfirmModal(true);

        res.items.forEach((item) => {
          item.autoIncrement = this.autoIncrementValue;
          this.selectedRulesList.push(this.mapRuleTableRecordToRule(item, problemType));
          this.autoIncrementValue++;
          updatedAttributesIndicesForRule(item, res.meta.attributes, this.attributes);
        });

        this.setDataSource();
        this.dataSourceChanged.emit(this.selectedRulesList);
      });
  }

  public addRule = () => {
    this.store
      .select(activeProjectSelector)
      .pipe(
        switchMap((project) => {
          const ids: Ids = {
            dataSetId: this.dataSetId,
            ruleSetId: this.ruleSetId,
            projectId: project.id,
          };
          const MODAL_SETTINGS: RulesTableEditorModalSettings = {
            ids,
            autoIncrement: 1,
            uuid: uuidv4(),
            decisionAttributeName: this.decisionAttributeName as string,
            displayType: RulesEditorDisplayTypes.RULE_ADDING_BACKEND,
          };
          return this.modalService
            .open(ProjectRulesTableEditorComponent, 'project.rules.add_new_modal.title_generate', '100%', '100%', {
              MODAL_SETTINGS,
            })
            .pipe(map((modalRef) => ({ modalRef, project })));
        }),
        switchMap(({ modalRef, project }) =>
          modalRef.getResult<any>().pipe(
            filter((res) => res !== undefined),
            map((res) => ({ res, project })),
          ),
        ),
        catchError((err) => {
          throw err;
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(({ res, project }) => {
        if (res) this.setShowConfirmModal(true);
        const addedRules = this.mapRuleTableRecordToRule(res.ruleTableRow, project.type_of_problem);
        this.selectedRulesList.push(addedRules);
        this.autoIncrementValue++;
        this.setDataSource();
        this.dataSourceChanged.emit(this.selectedRulesList);
      });
  };

  public editRow = (e: any) => {
    const selectedRow = e.row.data as Record<DataField, any>;
    this.store
      .select(activeProjectSelector)
      .pipe(
        switchMap((project) => {
          const ids: Ids = {
            dataSetId: this.dataSetId,
            ruleSetId: this.ruleSetId,
            projectId: project.id,
          };
          const MODAL_SETTINGS: RulesTableEditorModalSettings = {
            ids,
            autoIncrement: selectedRow.autoIncrement,
            uuid: selectedRow.uuid,
            selectedRow,
            decisionAttributeName: this.decisionAttributeName as string,
            displayType: RulesEditorDisplayTypes.RULE_EDITING,
          };
          return this.modalService
            .open(
              ProjectRulesTableEditorComponent,
              'project.rules.add_new_modal.title',
              '100%',
              '100%',
              {
                MODAL_SETTINGS,
              },
              {
                closeOnBackdropClick: true,
                position: ModalPositions.CENTER,
                closeOnEscapeClick: false,
              },
              {
                ruleNumber: selectedRow.autoIncrement,
              },
            )
            .pipe(map((modalRef) => ({ modalRef, project })));
        }),
        switchMap(({ modalRef, project }) =>
          modalRef.getResult<any>().pipe(
            filter((res) => res !== undefined),
            map((res) => [res, project]),
          ),
        ),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(([res, activeProject]) => {
        if (res) this.setShowConfirmModal(true);

        const index = this.selectedRulesList.findIndex((item) => item.uuid === res.ruleTableRow.uuid);
        this.selectedRulesList[index] = this.mapRuleTableRecordToRule(res.ruleTableRow, activeProject.type_of_problem);
        this.setDataSource();
        this.dataGrid.instance.repaint();
        this.dataSourceChanged.emit(this.selectedRulesList);
      });
  };

  public emitRulesFromTable = () => {
    this.setShowConfirmModal(false);
    this.modal.close({ rules: this.selectedRulesList });
  };

  public closeModal() {
    this.setShowConfirmModal(false);
    this.modal.close();
  }

  public customizeColumns = (cols: any) => {
    return this.customizeColsRulesSubTab(cols);
  };

  private setMatchingTree() {
    this.store
      .select(activeProjectSelector)
      .pipe(
        switchMap((project) => {
          return this.treeRefreshService.getTreeItemsOnlyRulesetsWithDatasetAttributes(project.id, this.dataSetId);
        }),
        takeUntil(this.ngUnsubscribe),
      )
     .subscribe(({ treeView, matchingDatasets }: { treeView: MappedItem[], matchingDatasets: { id: number; name: string }[] }) => {
        const matchingTree = this.treeRefreshService.filterMatchingDatasetFromTreeData(matchingDatasets, treeView);
        const lengthOfItemsInFirstProject = (matchingTree[0]?.items?.length ?? 0);
        this.hasMatchingTree = lengthOfItemsInFirstProject > 0;
        this.treeView = matchingTree;
      });
  }

  private setShowConfirmModal(shouldShowModal: boolean): void {
    this.modal.showConfirmModal = shouldShowModal;
  }

  private setCustomModalText(): void {
    this.modal.customConfirmText = 'project.confirm_close_modal.custom_modal_text.select_rules';
    this.modal.customTitleText = 'project.confirm_close_modal.title.custom_modal_title.select_rules';
  }

  private customizeColsRulesSubTab = (cols: any) => {
    cols.forEach((col: any) => {
      if (col.dataField === DataField.Uuid) {
        col.buttons = [
          {
            name: 'edit',
            onClick: this.editRow,
            template: 'editButtonTemplate',
          },
          {
            name: 'delete',
            template: 'deleteButtonTemplate',
          },
        ];
      }
    });
  };

  private mapRuleTableRecordToRule(ruleTableRow: RulesTableRow, problemType: ProblemTypes): any {
    return {
      ...ruleTableRow,
      uuid: ruleTableRow.uuid || uuidv4(),
      displayConclusion: makeDisplayConclusionValue(problemType, ruleTableRow.conclusion),
      displayString: removeIfAndThenFromRule(ruleTableRow.string),
    };
  }
}
