import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Store, select } from '@ngrx/store';

import { FieldName } from '../../../../../common/components/validation-message/validation-message.component';
import { Modal } from '../../../../../common/services/modal/modal';
import { AppState } from '../../../../../common/store/app-state.model';
import { selectCurrentV2TabText } from '../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { CustomTitleDatasetValidation } from '../../../../data-upload/utils/formValidators';

@Component({
  selector: 'rolap-dataset-view-modal',
  templateUrl: './dataset-view-modal.component.html',
  styleUrls: ['./dataset-view-modal.component.scss'],
})
export class DatasetViewModalComponent implements OnInit {
  public form: FormGroup;
  public FieldName = FieldName;

  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);
  private modal = inject(Modal<DatasetViewModalComponent>);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  private currentDataSetName$ = this.store.pipe(select(selectCurrentV2TabText));

  ngOnInit(): void {
    this.createForm();
  }

  public cancel(): void {
    this.modal.close();
  }

  public submitForm(): void {
    const formRawValue = this.form.getRawValue();
    const closeResult = {
      ...formRawValue,
    };
    this.modal.close(closeResult);
  }

  private createForm(): void {
    this.form = this.fb.group({
      dataSetName: ['', CustomTitleDatasetValidation],
    });

    const dataSetNameControl = this.form.get('dataSetName');

    if (dataSetNameControl) {
      this.currentDataSetName$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((currentDataSetName) => {
        if (!dataSetNameControl.dirty) {
          dataSetNameControl.setValue(currentDataSetName);
          dataSetNameControl.updateValueAndValidity();
          this.cdr.detectChanges();
        }
      });
    }
  }

  public isFormInvalid(): boolean {
    const dataSetNameControl = this.form.get('dataSetName');
    return (
      !dataSetNameControl ||
      dataSetNameControl.value === '' ||
      dataSetNameControl.value.length === 0 ||
      !this.form.valid ||
      !this.form.dirty
    );
  }
}
