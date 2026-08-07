import { Component, DestroyRef, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';

import { FieldName } from '../../../common/components/validation-message/validation-message.component';
import { CustomDescriptionDatasetValidation, CustomTitleDatasetValidation } from '../utils/formValidators';

export interface DatasetInfoFormValue {
  formValue: {
    datasetName: string;
    datasetDescription: string | null;
  };
  isValid: boolean;
}

@Component({
  selector: 'rolap-dataset-info',
  templateUrl: './dataset-info.component.html',
  styleUrls: ['./dataset-info.component.scss'],
})
export class DatasetInfoComponent implements OnInit {
  @Output() formDataEmitter = new EventEmitter<DatasetInfoFormValue>();
  public FieldName = FieldName;
  public datasetForm: FormGroup;

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.datasetForm = this.fb.group({
      datasetName: [null, CustomTitleDatasetValidation],
      datasetDescription: [null, CustomDescriptionDatasetValidation],
    });

    this.datasetForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((formValue) => {
      this.formDataEmitter.emit({ formValue, isValid: this.datasetForm.valid });
    });
  }
}
