import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ErrorResponse } from 'projects/rolap/src/app/common/interfaces/error-response.model';

import { FieldName } from '../../../../../../common/components/validation-message/validation-message.component';
import { Modal } from '../../../../../../common/services/modal/modal';
import { NotifyService } from '../../../../../../common/services/notify/notify.service';
import { AppState } from '../../../../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../../../../common/store/project/project.selectors';
import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import {
  CustomSplitRatioValidation,
  CustomSplitTestValidation,
  CustomSplitTrainValidation,
} from '../../../../../data-upload/utils/formValidators';
import { DatasetService } from '../../../service/dataset.service';
import { TreeviewRefreshService } from '../../service/treeview-refresh.service';
import { ProjectActions } from '../../../../../../common/store/project/project.action';

enum SplitMode {
  stratified = 'stratified',
  random = 'random',
  chronological = 'chronological',
}

@Component({
  selector: 'rolap-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss'],
})
export class SplitComponent implements OnInit, OnDestroy {
  @Input() name: string;
  @Input() ids: Ids;
  private readonly INVALID_LABELS_VALUES_ERROR_CODE = 'invalid_label_column_values';

  public trainTestForm: FormGroup;
  public radioGroupItems: string[] = [];
  public hasInvalidLabelsValuesError = false;
  public invalidLabelValuesErrorMessage: string;
  public FieldName = FieldName;
  private initialPercentValue = 30;
  private problemType: ProblemTypes;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private modal: Modal<SplitComponent>,
    private store: Store<AppState>,
    private datasetService: DatasetService,
    private treeViewRefreshService: TreeviewRefreshService,
    private notifyService: NotifyService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.setupProblemType();
    this.setupForm();
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.invalidLabelValuesErrorMessage = this.getInvalidLabelValuesErrorMessage();
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public split(): void {
    this.hasInvalidLabelsValuesError = false;
    const { splitRatio, test, train, splitMode } = this.trainTestForm.value;
    const dataSetId = this.ids.dataSetId as number;

    const body = {
      split_ratio: splitRatio / 100,
      training_set_name: train,
      test_set_name: test,
      split_mode: splitMode,
    };

    this.datasetService
      .splitDataset(dataSetId, body)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (response) => {
          if (!response) return;
          this.store.dispatch(ProjectActions.signalTreeDataRefresh());
          this.modal.close();
          this.notifyService.showNotify(
            this.translate.instant('project.treeview.context_menu.modal.train_test.dividing_success'),
            'success',
          );
        },
        error: (httpError: HttpErrorResponse) => {
          const errorCode: string | undefined = (httpError.error as ErrorResponse).err_msg_id;
          if (errorCode !== this.INVALID_LABELS_VALUES_ERROR_CODE) throw httpError;
          this.invalidLabelValuesErrorMessage = this.getInvalidLabelValuesErrorMessage();
          this.hasInvalidLabelsValuesError = true;
        },
      });
  }

  public closeModal(): void {
    this.modal.close();
  }

  private setupProblemType(): void {
    this.store
      .select(activeProjectSelector)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((activeProject) => {
        this.problemType = activeProject.type_of_problem;
      });

    this.setupMethodOfDividing();
  }

  private setupMethodOfDividing(): void {
    if (this.problemType === ProblemTypes.Regression) {
      this.radioGroupItems = Object.values(SplitMode).filter((mode: string) => mode !== SplitMode.stratified);
      return;
    }
    this.radioGroupItems = Object.values(SplitMode);
  }

  private setupForm() {
    const initialTrainValue = `${this.name}_train_${100 - this.initialPercentValue}`;
    const initialTestValue = `${this.name}_test_${this.initialPercentValue}`;

    this.trainTestForm = new FormGroup({
      splitRatio: new FormControl(this.initialPercentValue, CustomSplitRatioValidation),
      train: new FormControl(initialTrainValue, CustomSplitTrainValidation),
      test: new FormControl(initialTestValue, CustomSplitTestValidation),
      splitMode: new FormControl(this.radioGroupItems[0], [Validators.required]),
    });

    const trainControl = this.trainTestForm.get('train') as FormControl;
    const testControl = this.trainTestForm.get('test') as FormControl;

    this.trainTestForm
      .get('splitRatio')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value: number | null) => {
        if (value === null) value = 1;

        const trainName = `${this.name}_train_${100 - value}`;
        const testName = `${this.name}_test_${value}`;

        if (!testControl.dirty) {
          testControl.setValue(testName);
        }
        if (!trainControl.dirty) {
          trainControl.setValue(trainName);
        }
      });
  }
  private getInvalidLabelValuesErrorMessage(): string {
    const splitMethod: SplitMode = this.trainTestForm.value.splitMode;
    const baseErrorMessage = this.translate.instant(
      `project.treeview.context_menu.modal.train_test.invalid_label_column_values.${this.problemType}`,
    );
    const splitMethodErrorMessagePart = this.translate.instant(
      `project.treeview.context_menu.modal.train_test.invalid_label_column_values.${splitMethod}`,
    );
    return `${baseErrorMessage} ${splitMethodErrorMessagePart}`;
  }
}
