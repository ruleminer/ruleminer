import { OverlayRef } from '@angular/cdk/overlay';

import { Observable, Subject, map, take } from 'rxjs';

import { nanoid } from 'nanoid';

import { Modal } from './modal';

export class ModalRef<T> {
  public _id: string;
  private _onClose: Subject<void> = new Subject();

  constructor(public component: T | null, private overlay: OverlayRef, public modal: Modal<T>) {
    this._id = nanoid();
    ((this.modal as any).result as Observable<any>)
      .pipe(
        take(1),
        map(() => {
          this.close();
        }),
      )
      .subscribe((res) => {});
  }

  public onClose(): Observable<void> {
    return this._onClose;
  }

  public close(onXClick?: () => void): void {
    if (onXClick) {
      onXClick();
    }
    if (!this.modal.showConfirmModal) return this.closeModal();
    if (!this.modal.showConfirmModalOnClose) return this.closeModal();
    this.openConfirmModal();
  }

  public getResult<T>(): Observable<T> {
    return (this.modal as any).result;
  }

  public setShowConfirmModal(show: boolean): void {
    this.modal.showConfirmModal = show;
  }

  public setShowConfirmModalOnClose(show: boolean): void {
    this.modal.showConfirmModalOnClose = show;
  }

  private openConfirmModal(): void {
    const confirmClose = this.modal.confirmClose();
    if (!confirmClose) return;

    confirmClose.pipe(take(1)).subscribe((res) => {
      if (!res || res === undefined) return;
      this.modal.showConfirmModal = false;
      this.modal.close();
    });
  }

  private closeModal(): void {
    this._onClose.next(undefined);
    this._onClose.complete();
    (this.modal as any).emitCloseEvent();

    setTimeout(() => {
      this.overlay.detach();
    }, 250);
  }
}
