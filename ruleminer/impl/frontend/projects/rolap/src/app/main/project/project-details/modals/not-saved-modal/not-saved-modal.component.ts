import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { Modal } from '../../../../../common/services/modal/modal';

@Component({
  selector: 'rolap-not-saved-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, DxButtonModule],
  templateUrl: './not-saved-modal.component.html',
  styleUrls: ['./not-saved-modal.component.scss'],
})
export class NotSavedModalComponent {
  constructor(private modal: Modal<NotSavedModalComponent>) {}

  public cancel(): void {
    this.modal.close(false);
  }

  public confirm(): void {
    this.modal.close(true);
  }
}
