import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { AppState } from '../../store/app-state.model';
import { TourActions } from '../../store/tour/tour.action';
import {
  selectCurrentStepIndex,
  selectCurrentTourPosition,
  selectIsFirstStep,
  selectIsStepReady,
  selectIsTourActive,
} from '../../store/tour/tour.selectors';
import { CardModule } from '../card/card.module';
import { HighlightOverlayService } from './shadow-element/highlight-overlay.service';
import { TourApiService } from './tour-api.service';
import { TourProgressComponent } from './tour-progress/tour-progress.component';
import { TourService } from './tour.service';

@Component({
  standalone: true,
  selector: 'rolap-tour',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.scss'],
  imports: [CommonModule, CardModule, TranslateModule, TourProgressComponent, DxButtonModule],
})
export class TourComponent {
  private tourService = inject(TourService);
  private tourApiService = inject(TourApiService);
  private highlightOverlayService = inject(HighlightOverlayService);
  private store = inject(Store<AppState>);

  public steps = this.tourService.getSteps();
  public isFirstStepSignal = this.store.selectSignal(selectIsFirstStep);
  public currentStepIndexSignal = this.store.selectSignal(selectCurrentStepIndex);
  public currentStepPositionSignal = toSignal(this.store.select(selectCurrentTourPosition));
  public isStepReadySignal = toSignal(this.store.select(selectIsStepReady));
  public isTourActive = toSignal(this.store.select(selectIsTourActive));
  public isLastStepSignal = computed(() => this.currentStepIndexSignal() === this.steps.length - 1);
  public stepCounterSignal = computed(() => `${this.currentStepIndexSignal() + 1}/${this.steps.length}`);
  public currentStepDataSignal = computed(() => {
    const currentStepIndex = this.currentStepIndexSignal();
    if (currentStepIndex === undefined) return;
    const { title, content } = this.steps[currentStepIndex];
    return { title, content };
  });

  public hidden = computed(() => !this.isStepReadySignal());
  public showCancelButton = computed(() => this.hidden() && this.tourService.isElementNotFoundNotificationShown());

  public nextStep(): void {
    this.store.dispatch(TourActions.nextStep());
  }

  public prevStep(): void {
    this.store.dispatch(TourActions.prevStep());
  }

  public exitTour(): void {
    this.store.dispatch(TourActions.exitTour());
  }

  private updateStepPosition() {
    const currentStepIndex = this.currentStepIndexSignal();
    if (currentStepIndex === undefined) return;

    this.store.dispatch(TourActions.setCurrentPosition({ stepIndex: currentStepIndex }));
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    this.updateStepPosition();
  }
}
