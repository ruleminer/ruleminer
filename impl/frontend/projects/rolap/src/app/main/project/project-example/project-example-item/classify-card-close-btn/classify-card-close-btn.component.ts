import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';
import { DxButtonModule } from 'devextreme-angular';

import { AppState } from '../../../../../common/store/app-state.model';
import { V2ClassifyCardActions } from '../../../../../common/store/v2Classify/v2Classify.action';
import { selectShowClassifyCardCloseBtn } from '../../../../../common/store/v2Classify/v2Classify.selectors';

@Component({
  selector: 'rolap-classify-card-close-btn',
  standalone: true,
  imports: [CommonModule, DxButtonModule],
  template: `
    <div *ngIf="showCloseBtn()" class="close-btn-container">
      <dx-button (onClick)="close()" icon="close" />
    </div>
  `,
  styles: [
    `
      .close-btn-container {
        margin-top: -0.5em;
        margin-left: 0.75em;
      }
    `,
  ],
})
export class ClassifyCardCloseBtnComponent {
  @Input({ required: true }) cardId!: string;

  private store = inject(Store<AppState>);
  public showCloseBtn = toSignal(this.store.select(selectShowClassifyCardCloseBtn), { initialValue: false });

  public close(): void {
    this.store.dispatch(V2ClassifyCardActions.remove({ key: this.cardId }));
  }
}
