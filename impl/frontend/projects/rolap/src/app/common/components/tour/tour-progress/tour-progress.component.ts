import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { AppState } from '../../../store/app-state.model';
import {
  selectCurrentStepIndex,
  selectLocalCurrentStepIndex,
  selectVisibleSteps,
} from '../../../store/tour/tour.selectors';
import { TourService } from '../tour.service';

@Component({
  standalone: true,
  selector: 'rolap-tour-progress',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="tour-progress">
      <ng-container *ngFor="let step of visibleSteps(); let i = index">
        <div
          class="dot"
          [class.completed]="isCompletedSignal(i)()"
          [class.active]="i === localCurrentStepIndex()"></div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./tour-progress.component.scss'],
})
export class TourProgressComponent {
  private tourService = inject(TourService);
  private store = inject(Store<AppState>);

  private maxVisibleSteps = 7;
  public steps = this.tourService.getSteps();

  public currentStepIndexSignal = toSignal(this.store.select(selectCurrentStepIndex), { initialValue: 0 });

  public visibleSteps = toSignal(this.store.select(selectVisibleSteps(this.maxVisibleSteps, this.steps)), {
    initialValue: [],
  });

  public localCurrentStepIndex = toSignal(
    this.store.select(selectLocalCurrentStepIndex(this.maxVisibleSteps, this.steps)),
    { initialValue: 0 },
  );

  public isCompletedSignal = (i: number) =>
    computed(() => {
      const currentIndex = this.currentStepIndexSignal();
      return i < currentIndex;
    });
}
