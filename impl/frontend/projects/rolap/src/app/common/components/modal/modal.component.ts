import { animate, style, transition, trigger } from '@angular/animations';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';

import { take } from 'rxjs';

import { ModalRef } from '../../services/modal/modal-ref';
import { ModalPosition, ModalPositions } from '../../services/modal/modal.service';

type State = 'opened' | 'closed';
type ModalState = `${ModalPosition}_${State}`;

@Component({
  selector: 'common-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition('* => center_opened', [
        style({
          opacity: 0,
          boxShadow: 'var(--no-shadow)',
          transform: 'scale(0.5)',
        }),
        animate(
          '0.26s ease-in-out',
          style({
            opacity: 1,
            boxShadow: 'var(--modal-shadow)',
            transform: 'scale(1)',
          }),
        ),
      ]),
      transition('* => center_closed', [
        animate(
          '0.26s ease-in-out',
          style({
            opacity: 0,
            boxShadow: 'var(--no-shadow)',
            transform: 'scale(0.5)',
          }),
        ),
      ]),
    ]),
  ],
})
export class ModalComponent {
  @Input() modalRef: ModalRef<any>;
  @Input() componentPortal: ComponentPortal<any>;
  @Input() title: string | null;
  @Input() data: any;
  @Input() closeOnEscapeClick = true;
  @Input() translateParams: any;
  @Input() onXClick?: () => void;
  @Output() onAttached: EventEmitter<ModalRef<any>> = new EventEmitter();

  public position = ModalPositions.CENTER;
  public state: ModalState;
  public positions = ModalPositions;

  constructor(private elementRef: ElementRef, private changeDetector: ChangeDetectorRef) {}

  public onAttach(event: any): void {
    this.modalRef.component = event.instance;
    this.setModalRefComponentInputs();
    this.onAttached.emit(this.modalRef);
    setTimeout(() => this.setFocus(), 100);
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.setModalState('opened');
    this.modalRef
      .onClose()
      .pipe(take(1))
      .subscribe(() => this.setModalState('closed'));
  }

  public close(): void {
    if (this.onXClick) {
      this.onXClick();
    }
    this.modalRef.close();
  }

  private setFocus(): void {
    const element = this.elementRef.nativeElement;
    const focusElement = element.querySelector('*[autofocus]');
    focusElement?.focus();
  }

  private setModalRefComponentInputs(): void {
    if (!this.data) return;
    for (const key in this.data) {
      this.modalRef.component[key] = this.data[key];
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.handleEscapeClick(event);
  }

  private handleEscapeClick(event: KeyboardEvent): void {
    //escape click turned off
    if (!this.closeOnEscapeClick) return;

    //if esc key was pressed in combination with ctrl or alt or shift
    const isCombinedKey = event.ctrlKey || event.altKey || event.shiftKey;

    if (isCombinedKey) return;
    // Escape key was pressed with out any group keys
    this.modalRef.close();
  }

  private setModalState(state: State): void {
    this.state = `${this.position}_${state}`;
    this.changeDetector.detectChanges();
  }
}
