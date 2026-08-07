import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { Observable, Subject, map, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { Modal } from '../../../../../../common/services/modal/modal';
import { NotifyService } from '../../../../../../common/services/notify/notify.service';
import { isDataSet, isRuleSet } from '../../../../../../common/store/v2Tabs/utils';
import {
  CustomTitleDatasetValidation,
  CustomTitleRuleSetValidation,
} from '../../../../../data-upload/utils/formValidators';
import { ProjectService } from '../../../../service/project.service';
import { DatasetService } from '../../../service/dataset.service';
import { TreeviewRefreshService } from '../../service/treeview-refresh.service';
import { ProjectActions } from '../../../../../../common/store/project/project.action';
import { AppState } from '../../../../../../common/store/app-state.model';
import { Store } from '@ngrx/store';

@Component({
  selector: 'rolap-duplicate',
  templateUrl: './duplicate.component.html',
  styleUrls: ['./duplicate.component.scss'],
})
export class DuplicateComponent implements OnInit, OnDestroy {
  @Input() dataSetId: number;
  @Input() ruleSetId: number;
  @Input() projectId: number;
  @Input() type: 'ruleSet' | 'dataSet';
  @Input() name: string;

  public duplicateForm: FormGroup;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private modal: Modal<DuplicateComponent>,
    private fb: FormBuilder,
    private dataSetService: DatasetService,
    private projectService: ProjectService,
    private translate: TranslateService,
    private treeViewRefreshService: TreeviewRefreshService,
    private notifyService: NotifyService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.setShowConfirmModalOnClose(true);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public closeModal() {
    this.setShowConfirmModal(false);
    this.modal.close();
  }

  public duplicate() {
    const result$ = this.triggerDuplicationRequest();

    result$!
      .pipe(
        map((duplicate: any) => ({ duplicate })),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe({
        error: (err) => {
          this.closeModal();
          throw err;
        },
        complete: () => this.handleSuccessfulDuplication(),
      });
  }

  private createForm() {
    const controls: { [key: string]: FormControl } = {
      name: new FormControl(
        this.name,
        this.type === 'dataSet' ? CustomTitleDatasetValidation : CustomTitleRuleSetValidation,
      ),
    };

    if (this.type === 'dataSet') {
      controls['cloneRelated'] = new FormControl(false);
    }

    this.duplicateForm = new FormGroup(controls);

    this.duplicateForm.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
      if (this.name !== value.name) return this.setShowConfirmModal(true);
      this.setShowConfirmModal(false);
    });
  }

  private triggerDuplicationRequest(): Observable<any> | void {
    const baseData = {
      name: this.duplicateForm.controls['name'].value,
      description: isDataSet(this.type) ? this.name : '',
    };

    if (isRuleSet(this.type)) return this.projectService.duplicateRuleSet(this.ruleSetId, baseData);
    if (isDataSet(this.type)) {
      const clone_related = this.duplicateForm.controls['cloneRelated']?.value || false;
      return this.dataSetService.duplicateDataset(this.dataSetId, {
        ...baseData,
        clone_related,
      });
    }
  }

  private handleSuccessfulDuplication(): void {
    this.closeModal();
    this.store.dispatch(ProjectActions.signalTreeDataRefresh());

    this.notifyService.showNotify(
      this.translate.instant('project.treeview.context_menu.modal.duplicate.success'),
      'success',
    );
  }

  private setShowConfirmModal(shouldShowModal: boolean): void {
    this.modal.showConfirmModal = shouldShowModal;
  }

  private setShowConfirmModalOnClose(shouldShowModal: boolean): void {
    this.modal.showConfirmModalOnClose = shouldShowModal;
  }
}
