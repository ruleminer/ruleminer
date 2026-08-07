import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';

import { DxButtonModule } from 'devextreme-angular';

import { Modal } from '../modal';

export type ConfirmCloseText = {
  body: string;
  confirm: string;
  cancel: string;
};

@Component({
  selector: 'rolap-confirm-close',
  standalone: true,
  imports: [CommonModule, DxButtonModule],
  templateUrl: './confirm-close.component.html',
  styleUrls: ['./confirm-close.component.scss'],
})
export class ConfirmCloseComponent {
  @Input() text: ConfirmCloseText;

  constructor(private modal: Modal<ConfirmCloseComponent>) {}

  @HostListener('document:keydown.escape', ['$event'])
  public onEscape(event: KeyboardEvent) {
    setTimeout(() => {
      event.preventDefault();
      this.cancel();
    }, 250);
  }

  public cancel(): void {
    this.modal.close(false);
  }

  public confirm(): void {
    this.modal.close(true);
  }
}
