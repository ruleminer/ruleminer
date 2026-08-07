import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { ModalService } from './modal.service';

// Modal Object can be injected into component constructor to close modal window.
// constructor(private modal: Modal<ComponentType>) {}
@Injectable()
export class Modal<T> {
  public title: string;
  public data?: T;
  public showConfirmModal = false;
  public customConfirmText: string;
  public customTitleText: string;
  public showConfirmModalOnClose = true;

  private result: Subject<any>;
  private _onClose: Subject<void>;

  constructor(private modalService: ModalService) {
    this.result = new Subject();
    this._onClose = new Subject();
  }

  private emitCloseEvent(): void {
    this._onClose.next();
    this._onClose.complete();
  }

  public close(result?: any): void {
    this.result.next(result);
    this.result.complete();
    this.emitCloseEvent();
  }

  public get onClose(): Observable<void> {
    return this._onClose;
  }

  public confirmClose() {
    return this.modalService.confirmClose(this.customConfirmText, this.customTitleText);
  }
}
