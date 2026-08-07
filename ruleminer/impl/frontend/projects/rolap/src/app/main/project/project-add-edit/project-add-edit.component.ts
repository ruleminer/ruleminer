import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { Subject, switchMap, takeUntil } from 'rxjs';

import { faSpinner, faTrash } from '@fortawesome/pro-regular-svg-icons';

import { FieldName } from '../../../common/components/validation-message/validation-message.component';
import { Modal } from '../../../common/services/modal/modal';
import { ModalRef } from '../../../common/services/modal/modal-ref';
import { ModalService } from '../../../common/services/modal/modal.service';
import { ProblemTypes } from '../../data-upload/utils/enums';
import {
  CustomProjectDescriptionValidation,
  CustomProjectNameValidation,
} from '../../data-upload/utils/formValidators';
import { ProjectEdit } from '../models/project';
import { DeleteProjectConfirmComponent } from '../project-tile/delete-project-confirm/delete-project-confirm.component';
import { ProjectService } from '../service/project.service';

@Component({
  selector: 'rolap-project-add-edit',
  templateUrl: './project-add-edit.component.html',
  styleUrls: ['./project-add-edit.component.scss'],
})
export class ProjectAddEditComponent implements OnInit, OnDestroy {
  @Input() editMode = false;
  @Input() projectId: number | undefined;
  @Input() initialTitle: string | undefined;
  @Input() initialDescription: string | undefined;
  @Input() initialPurpose: ProblemTypes | undefined;
  @Input() created_at: string;
  @Input() updated_at: string;
  @Input() last_opened_at: string;
  @Input() isInformation: boolean = false;
  public isDeleting = false;
  public faSpinner = faSpinner;
  public faTrashIcon = faTrash;
  public projectForm!: FormGroup;
  public FieldName = FieldName;
  private radioButtonOptions = Object.values(ProblemTypes);
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectService,
    private modalService: ModalService,
    private modal: Modal<ProjectAddEditComponent>,
  ) {}

  ngOnInit(): void {
    this.projectForm = this.formBuilder.group({
      purpose: [null, Validators.required],
      projectName: [null, CustomProjectNameValidation],
      projectDescription: ['', CustomProjectDescriptionValidation],
    });
    if (this.initialTitle) {
      this.projectForm.controls['projectName'].setValue(this.initialTitle);
    }
    if (this.initialDescription) {
      this.projectForm.controls['projectDescription'].setValue(this.initialDescription);
    }
    if (this.initialPurpose) {
      const value = this.radioButtonOptions.find(
        (option: string) => option.toLowerCase() === this.initialPurpose?.toLowerCase(),
      );
      this.projectForm.controls['purpose'].setValue(value);
    } else {
      this.projectForm.controls['purpose'].setValue(this.radioButtonOptions[0]);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public saveEditPopup(): void {
    if (!this.projectId) return;
    const projectData = this.projectForm.value;
    const project: ProjectEdit = {
      name: projectData.projectName,
      type_of_problem: projectData.purpose.toLowerCase(),
      description: projectData.projectDescription,
    };

    this.projectService
      .editProject(project, this.projectId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.modal.close(project);
      });
  }

  public cancelEditPopup(): void {
    this.modal.close();
  }

  public onDeleteClick(): void {
    this.isDeleting = true;
    this.modalService
      .open(DeleteProjectConfirmComponent, 'project.delete_project.title', '400px', undefined, {
        projectId: this.projectId,
      })
      .pipe(
        switchMap((modalRef: ModalRef<DeleteProjectConfirmComponent>) => modalRef.getResult().pipe(filterOutNullish())),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((res: any) => {
        if (!res) return;
        this.isDeleting = false;
        this.modal.close({ delete: res });
      });
  }
}
