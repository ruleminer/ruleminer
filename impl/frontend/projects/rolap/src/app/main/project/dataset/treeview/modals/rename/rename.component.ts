import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { Observable, Subject, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { Modal } from '../../../../../../common/services/modal/modal';
import { NotifyService } from '../../../../../../common/services/notify/notify.service';
import { RuleSetApiService } from '../../../../../../common/services/rule-set/rule-set-api.service';
import { AppState, TabType } from '../../../../../../common/store/app-state.model';
import { ProjectActions } from '../../../../../../common/store/project/project.action';
import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { generateNgrxKey, isDataSet, isReport, isRuleSet } from '../../../../../../common/store/v2Tabs/utils';
import { V2TabsActions } from '../../../../../../common/store/v2Tabs/v2Tabs.action';
import {
  CustomTitleDatasetValidation,
  CustomTitleRuleSetValidation,
} from '../../../../../data-upload/utils/formValidators';
import { RuleSetDetailsRequest } from '../../../../models/ruleset';
import { ReportService } from '../../../../service/report.service';
import { DatasetService } from '../../../service/dataset.service';

@Component({
  selector: 'rolap-rename',
  templateUrl: './rename.component.html',
  styleUrls: ['./rename.component.scss'],
})
export class RenameComponent implements OnInit, OnDestroy {
  @Input() ids: Ids;
  @Input() type: TabType;
  @Input() name: string;

  public renameForm: FormGroup;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private modal: Modal<RenameComponent>,
    private dataSetService: DatasetService,
    private ruleSetService: RuleSetApiService,
    private reportService: ReportService,
    private translate: TranslateService,
    private notifyService: NotifyService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.setShowConfirmModalOnClose(true);
    this.creteForm();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public closeModal(nameChanged: boolean) {
    this.setShowConfirmModal(false);
    this.modal.close(nameChanged);
  }

  //TODO: move this to effects in future
  public rename() {
    const data: RuleSetDetailsRequest = {
      name: this.renameForm.controls['name'].value,
    };
    let service: Observable<Object>;
    if (isDataSet(this.type)) {
      service = this.dataSetService.renameDataset(this.ids.dataSetId!, data);
    } else if (isRuleSet(this.type)) {
      service = this.ruleSetService.renameRuleset(this.ids.dataSetId!, this.ids.ruleSetId!, data);
    } else if (isReport(this.type)) {
      service = this.reportService.renameReport(this.ids.reportId!, data.name);
    }

    service!.pipe(take(1)).subscribe(() => {
      this.closeModal(true);
      this.updateTabName(this.ids, data.name, this.type);
      this.store.dispatch(ProjectActions.signalTreeDataRefresh());
      this.notifyService.showNotify(
        this.translate.instant('project.treeview.context_menu.modal.rename.rename_success'),
        'success',
      );
    });
  }

  private creteForm() {
    this.renameForm = new FormGroup({
      name: new FormControl(
        this.name,
        isDataSet(this.type) ? CustomTitleDatasetValidation : CustomTitleRuleSetValidation,
      ),
    });

    this.renameForm.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
      if (this.name !== value.name) return this.setShowConfirmModal(true);
      this.setShowConfirmModal(false);
    });
  }

  private updateTabName(ids: Ids, name: string, tabType: TabType) {
    const projectId = ids.projectId as number;
    const dataSetId = ids.dataSetId as number;
    const ruleSetId = (ids.ruleSetId as number) || 0;
    const reportId = (ids.reportId as number) || 0;
    const key = generateNgrxKey(projectId, dataSetId, ruleSetId, reportId, tabType);
    let description = '';
    this.store
      .select('v2Tabs')
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe((state: any) => {
        const tab = state.entities[key];
        if (tab && tab.description) {
          description = tab.description;
        }
        this.store.dispatch(V2TabsActions.setV2TabDescriptionAndNameComplete({ key, name, tabType, description }));
      });
  }

  private setShowConfirmModal(shouldShowModal: boolean): void {
    this.modal.showConfirmModal = shouldShowModal;
  }

  private setShowConfirmModalOnClose(shouldShowModal: boolean): void {
    this.modal.showConfirmModalOnClose = shouldShowModal;
  }
}
