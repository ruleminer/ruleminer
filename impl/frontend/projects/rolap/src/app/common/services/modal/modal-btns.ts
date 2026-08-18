import { inject } from '@angular/core';

import { Modal } from './modal';

export abstract class ModalBtns<T> {
  protected modal = inject(Modal) as Modal<T>;

  protected abstract get form(): any;

  public cancel(): void {
    this.modal.close(null);
  }

  public submitForm(): void {
    if (!this.form) {
      throw new Error('Form is not defined in the derived class.');
    }
    this.modal.close(this.form.getRawValue());
  }
}
