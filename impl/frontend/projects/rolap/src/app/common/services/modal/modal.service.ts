import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable, Injector } from '@angular/core';

import { Observable, forkJoin } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { find } from 'lodash';

import { ModalComponent } from '../../components/modal/modal.component';
import { ConfirmCloseComponent } from './confirm-close/confirm-close.component';
import { Modal } from './modal';
import { ModalRef } from './modal-ref';

export type ModalPosition = 'side-right' | 'center' | 'cover' | 'bottom';
export const ModalPositions = {
  SIDE_RIGHT: 'side-right' as ModalPosition,
  CENTER: 'center' as ModalPosition,
  COVER: 'cover' as ModalPosition,
  BOTTOM: 'bottom' as ModalPosition,
};

export interface ModalConfig {
  closeOnBackdropClick: boolean;
  position: ModalPosition;
  closeOnEscapeClick: boolean;
  params?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private _activeModals: ModalRef<any>[] = [];

  constructor(private overlay: Overlay, private translateService: TranslateService) {}

  /*
   Open modal window. Returns Observable with result of modal window.
    ComponentType - component to be rendered inside modal window
    title - title of modal window
    w - width of modal window 400px by default
    h - height of modal window If undefined, height will be assumed automatically based on content
    data - data to be passed to component (only inputs)
    config - configuration of modal window
    */
  public open<T>(
    ComponentType: any,
    title: string | null = null,
    w = '400px',
    h = 'auto',
    data?: T,
    config: ModalConfig = {
      closeOnBackdropClick: true,
      closeOnEscapeClick: true,
      position: ModalPositions.CENTER,
    },
    translateParams?: any,
    hasBackdrop = true,
    onXClick?: () => void,
  ): Observable<ModalRef<typeof ComponentType>> {
    if (h === '100vh') {
      throw new Error(
        'Please change the modal’s height to 100% instead of 100vh, as 100vh is not allowed for the height property in modal.service.',
      );
    }
    const height = h === '100%' ? 'calc(100vh - 64px)' : h;
    const triggerElement: Element | null = document.activeElement;
    config.position = h === '100%' ? ModalPositions.BOTTOM : config.position;

    const positionStrategy = this.overlay.position().global();

    switch (config.position) {
      case ModalPositions.BOTTOM:
        positionStrategy.centerHorizontally().bottom('0');
        break;
      case ModalPositions.CENTER:
        positionStrategy.centerHorizontally().centerVertically();
        break;
      case ModalPositions.SIDE_RIGHT:
        positionStrategy.right('0').centerVertically();
        break;
      case ModalPositions.COVER:
        positionStrategy.top('0').left('0').width('100%').height('100%');
        break;
    }

    const configs = new OverlayConfig({
      hasBackdrop: h === '100%' ? false : hasBackdrop,
      width: w,
      height: height,
      positionStrategy,
    });
    const overlayRef = this.overlay.create(configs);
    const modal: Modal<T> = new Modal(this);
    const modalRef = new ModalRef(null, overlayRef, modal);

    const portal = new ComponentPortal(ModalComponent);
    const modalPortal = new ComponentPortal(ComponentType, null, this.createInjector(modal));

    const modalWrapperCompRef: ComponentRef<ModalComponent> = overlayRef.attach(portal);
    modalWrapperCompRef.instance.componentPortal = modalPortal;
    modalWrapperCompRef.instance.modalRef = modalRef;
    modalWrapperCompRef.instance.position = config.position;
    modalWrapperCompRef.instance.title = title;
    modalWrapperCompRef.instance.data = data;
    modalWrapperCompRef.instance.onXClick = onXClick;
    modalWrapperCompRef.instance.translateParams = translateParams;
    modalWrapperCompRef.instance.closeOnEscapeClick = config.closeOnEscapeClick;

    this.disableBodyScroll();

    modalRef.onClose().subscribe((_res) => {
      document.body.querySelector('app-root')?.setAttribute('aria-hidden', 'false');
      this.enableBodyScroll();

      // try to return focus to trigger element
      if (triggerElement !== null) {
        (triggerElement as any).focus();
      }
    });

    if (config.closeOnBackdropClick) {
      overlayRef
        .backdropClick()
        .pipe(take(1))
        .subscribe((_res) => {
          modalRef.close();
        });
    }
    document.body.querySelector('app-root')?.setAttribute('aria-hidden', 'true');
    this._activeModals.push(modalRef);
    modalRef.onClose().subscribe((_res) => {
      const index = this._activeModals.findIndex((modal: ModalRef<any>) => modal._id === modalRef._id);
      if (index >= 0) {
        this._activeModals.splice(index, 1);
      }
    });

    return modalWrapperCompRef.instance.onAttached.pipe(take(1));
  }

  // Close all active modals
  public closeAll(): void {
    this._activeModals.forEach((modalRef: ModalRef<any>) => {
      modalRef.setShowConfirmModal(false)
      modalRef.setShowConfirmModalOnClose(false);
      modalRef.close();
      this.enableBodyScroll();
    });
  }

  public confirmClose(
    customConfirmText = 'project.confirm_close_modal.body',
    customTitleText = 'project.confirm_close_modal.title.default',
  ): Observable<any> {
    const existingModal = find(
      this._activeModals,
      (modalRef) => modalRef.component instanceof ConfirmCloseComponent
    );
  
    if (existingModal) {
      return existingModal.getResult().pipe(take(1));
    }
  
    return forkJoin({
      body: this.translateService.get(customConfirmText),
      confirm: this.translateService.get('project.confirm_close_modal.confirm_btn'),
      cancel: this.translateService.get('project.confirm_close_modal.cancel_btn'),
    }).pipe(
      take(1),
      switchMap((data) => {
        const config: ModalConfig = {
          closeOnBackdropClick: true,
          position: ModalPositions.CENTER,
          closeOnEscapeClick: false,
        };
        return this.open(ConfirmCloseComponent, customTitleText, '400px', undefined, { text: data }, config).pipe(
          switchMap((modalRef: any) => modalRef.getResult()),
          take(1),
        );
      }),
    );
  }

  public getActiveModals(): ModalRef<any>[] {
    return this._activeModals;
  }

  private createInjector<T>(modal: Modal<T>): Injector {
    return Injector.create({
      providers: [
        {
          provide: Modal,
          useValue: modal,
        },
      ],
    });
  }

  /**
   * Prevents from scrolling the page under the modal window.
   */
  private disableBodyScroll() {
    document.body.classList.add('no-scroll');
  }

  /**
   * Enable body scrolling.
   */
  private enableBodyScroll() {
    document.body.classList.remove('no-scroll');
  }
}
