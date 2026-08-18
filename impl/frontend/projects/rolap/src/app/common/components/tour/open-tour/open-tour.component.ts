import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, inject } from '@angular/core';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { Modal } from '../../../services/modal/modal';
import { AppState } from '../../../store/app-state.model';
import { TourActions } from '../../../store/tour/tour.action';
import { TourApiService } from '../tour-api.service';
import { TourService } from '../tour.service';

@Component({
  selector: 'rolap-open-tour',
  template: ` <p>{{ 'tour.config.content' | translate }}</p>
    <div class="flex justify-end mt3">
      <dx-button
        class="mr2"
        type="normal"
        (click)="cancel()"
        [text]="'tour.config.cancel' | translate"
        data-cy="tour-modal-cancel-btn" />
      <dx-button type="default" (click)="confirm()" [text]="'tour.config.confirm' | translate" />
    </div>`,
  standalone: true,
  imports: [CommonModule, DxButtonModule, TranslateModule],
})
export class OpenTourComponent {
  private modal = inject(Modal<OpenTourComponent>);
  private tourApiService = inject(TourApiService);
  private tourService = inject(TourService);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store<AppState>);

  @HostListener('document:keydown.escape', ['$event'])
  public onEscape(event: KeyboardEvent) {
    setTimeout(() => {
      event.preventDefault();
      this.cancel();
    }, 250);
  }

  public cancel(): void {
    this.store.dispatch(TourActions.completeTour());
    this.modal.close(false);
  }

  public confirm(): void {
    this.modal.close(true);
    this.tourService.startTour(0);
  }
}
