import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { switchMap } from 'rxjs';

import { faPlus } from '@fortawesome/pro-regular-svg-icons';

import { ModalRef } from '../../../../common/services/modal/modal-ref';
import { ModalPositions, ModalService } from '../../../../common/services/modal/modal.service';
import { UploadStepperModalComponent } from '../../../data-upload/upload-stepper-modal/upload-stepper-modal.component';

@Component({
  selector: 'rolap-project-create',
  templateUrl: './project-create.component.html',
  styleUrls: ['./project-create.component.scss'],
})
export class ProjectCreateComponent {
  @Input({ required: true }) isProjectLimitReached: boolean;

  private modalService = inject(ModalService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public faIconPlus = faPlus;

  public openFileImporterPopup(): void {
    this.modalService
      .open(
        UploadStepperModalComponent,
        'project.new_project',
        '100%',
        '100%',
        null,
        {
          closeOnBackdropClick: true,
          position: ModalPositions.BOTTOM,
          closeOnEscapeClick: false,
        },
        null,
        false,
      )
      .pipe(
        switchMap((modalRef: ModalRef<UploadStepperModalComponent>) => modalRef.getResult()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res: any) => {
        if (!res || !res.projectId) return;
        this.router.navigate(['/projects', res.projectId]);
      });
  }
}
