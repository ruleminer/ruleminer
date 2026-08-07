import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { EMPTY, Observable, Subject, catchError, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { TinyTabInfo } from '../../../../../../common/interfaces/tab.model';
import { Modal } from '../../../../../../common/services/modal/modal';
import { NotifyService } from '../../../../../../common/services/notify/notify.service';
import { RuleSetApiService } from '../../../../../../common/services/rule-set/rule-set-api.service';
import { AppState } from '../../../../../../common/store/app-state.model';
import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { TabsActions } from '../../../../../../common/store/ruleSets/tabs.action';
import {
  generateNgrxKey,
  isDataSet,
  isEdaWhiteOrBoxOrPrediction,
  isReport,
  isRuleSet,
} from '../../../../../../common/store/v2Tabs/utils';
import { ReportService } from '../../../../service/report.service';
import { TreeView } from '../../../models/treeview';
import { DatasetService } from '../../../service/dataset.service';
import { TreeviewRefreshService } from '../../service/treeview-refresh.service';
import { ProjectActions } from '../../../../../../common/store/project/project.action';

export type ModalType = 'report' | 'dataSet' | 'ruleSet';

@Component({
  selector: 'rolap-delete-project-confirm',
  templateUrl: './delete-confirm.component.html',
  styleUrls: ['./delete-confirm.component.scss'],
})
export class DeleteConfirmComponent implements OnInit, OnDestroy {
  @Input() ids: Ids;
  @Input() type: ModalType;
  @Input() treeView: TreeView;

  public translateType: string;
  private ngUnsubscribe: Subject<void> = new Subject();
  constructor(
    private modal: Modal<DeleteConfirmComponent>,
    private dataSetService: DatasetService,
    private ruleSetService: RuleSetApiService,
    private reportService: ReportService,
    private translate: TranslateService,
    private treeViewRefreshService: TreeviewRefreshService,
    private notifyService: NotifyService,
    private store: Store<AppState>,
  ) {}

  ngOnInit() {
    this.setTranslateType();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public closeModal(deleted: boolean) {
    this.modal.close(deleted);
  }

  public deleteElement() {
    this.deleteElementBasedOnType()
      .pipe(
        take(1),
        catchError((err) => {
          this.closeModal(false);
          throw err;
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => {
        this.closeModal(true);
        this.closeTabs();
        this.store.dispatch(ProjectActions.signalTreeDataRefresh());

        this.notifyService.showNotify(
          this.translate.instant(
            `project.treeview.context_menu.modal.delete_confirm.${this.translateType}.delete_success`,
          ),
          'success',
        );
      });
  }

  private deleteElementBasedOnType(): Observable<void> {
    if (isDataSet(this.type)) return this.dataSetService.deleteDataset(this.ids.dataSetId!);
    if (isRuleSet(this.type)) return this.ruleSetService.deleteRuleset(this.ids.dataSetId!, this.ids.ruleSetId!);
    if (isReport(this.type)) return this.reportService.deleteReport(this.ids.reportId!);

    return EMPTY;
  }

  private closeTabs() {
    const data: TinyTabInfo = {
      ids: this.ids,
      type: this.type,
    };

    const tabsToClose = this.getTabsToClose(data).map((x) => {
      let type = '';
      if (isDataSet(x.type)) type = 'dataSet';
      if (isRuleSet(x.type)) type = 'ruleSet';
      if (isEdaWhiteOrBoxOrPrediction(x.type)) type = 'report';
      return generateNgrxKey(x.ids.projectId, x.ids.dataSetId, x.ids.ruleSetId, x.ids.reportId, type);
    });
    this.store.dispatch(TabsActions.closeMultipleTabs({ v2TabIdArr: tabsToClose }));
  }

  /**
   * Returns an array with information about the IDs of the data sets and rule sets for which tabs should be closed.
   *
   * @param data - information about the item being removed from the project tree
   */
  private getTabsToClose(data: TinyTabInfo): TinyTabInfo[] {
    const treeData = this.getDataFromTree(this.treeView[0].items!);

    if (isRuleSet(data.type)) return treeData.filter((x) => x.ids.ruleSetId === data.ids.ruleSetId);
    return treeData.filter((x) => x.ids.dataSetId === data.ids.dataSetId);
  }

  /**
   * Returns information about the IDs of data sets and rule sets in the tree.
   *
   * @param items - project tree data
   */
  private getDataFromTree(items: any[]): TinyTabInfo[] {
    let data: TinyTabInfo[] = [];

    for (let i = 0; i < items.length; i++) {
      const ids = items[i].ids as Ids;
      const treeData: TinyTabInfo = {
        ids,
        type: items[i].type!,
      };

      data.push(treeData);

      if (items[i].items?.length) {
        data = [...data, ...this.getDataFromTree(items[i].items!)];
      }
    }

    return data;
  }

  private setTranslateType(): void {
    const translateTypeMap = {
      dataSet: 'data_set',
      ruleSet: 'rule_set',
      report: 'report',
    };

    this.translateType = translateTypeMap[this.type] || this.type;
  }
}
