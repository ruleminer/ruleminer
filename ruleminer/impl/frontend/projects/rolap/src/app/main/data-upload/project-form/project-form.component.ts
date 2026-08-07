import { Component, DestroyRef, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { FieldName } from '../../../common/components/validation-message/validation-message.component';
import { ProblemTypes } from '../utils/enums';
import { CustomProjectDescriptionValidation, CustomProjectNameValidation } from '../utils/formValidators';
import { ProjectFormValue } from '../utils/types';

@Component({
  selector: 'rolap-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
})
export class ProjectFormComponent implements OnInit {
  @Output() projectFormValueChange = new EventEmitter<ProjectFormValue>();

  public radioButtonOptions = Object.values(ProblemTypes);
  public projectForm: FormGroup;
  public FieldName = FieldName;

  private translateService = inject(TranslateService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      purpose: [this.radioButtonOptions[0], Validators.required],
      projectName: [null, CustomProjectNameValidation],
      projectDescription: [null, CustomProjectDescriptionValidation],
    });

    this.projectForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((formValue) => {
      const projectFormValue = { formValue, isValid: this.projectForm.valid };
      this.projectFormValueChange.emit(projectFormValue);
    });
  }
}
