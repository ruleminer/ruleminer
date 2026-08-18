import { Component, HostListener, Input, OnDestroy } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { Modal } from '../../../../common/services/modal/modal';
import { NotifyService } from '../../../../common/services/notify/notify.service';
import { ProjectService } from '../../service/project.service';

@Component({
  selector: 'rolap-delete-project-confirm',
  templateUrl: './delete-project-confirm.component.html',
  styleUrls: ['./delete-project-confirm.component.scss'],
})
export class DeleteProjectConfirmComponent implements OnDestroy {
  @Input() projectId: number;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private modal: Modal<DeleteProjectConfirmComponent>,
    private projectService: ProjectService,
    private notifyService: NotifyService,
    private translate: TranslateService,
  ) {}

  @HostListener('document:keydown.escape', ['$event'])
  public onEscape(event: KeyboardEvent) {
    setTimeout(() => {
      event.preventDefault();
      this.cancel();
    }, 250);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public cancel(): void {
    this.modal.close(false);
  }

  public confirm(): void {
    this.projectService
      .deleteProject(this.projectId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        complete: () => {
          this.notifyService.showNotify(this.translate.instant('toast_messages.success.project_remove'), 'success');
          this.modal.close(true);
        },
      });
  }
}
