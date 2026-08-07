import { Component, Input } from '@angular/core';

import { Modal } from '../../../common/services/modal/modal';

@Component({
  selector: 'rolap-delete-confirm',
  templateUrl: './project-summary-delete-confirm.component.html',
  styleUrls: ['./project-summary-delete-confirm.component.scss'],
})
export class ProjectSummaryDeleteConfirmComponent {
  @Input() content: string;

  constructor(private modal: Modal<ProjectSummaryDeleteConfirmComponent>) {}

  public closeModal(deleted: boolean) {
    this.modal.close(deleted);
  }
}
