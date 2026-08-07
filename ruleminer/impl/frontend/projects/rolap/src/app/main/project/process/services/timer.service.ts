import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { BehaviorSubject } from 'rxjs';
import { AppState } from '../../../../common/store/app-state.model';
import { ProjectActions } from '../../../../common/store/project/project.action';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private interval: any;

  private timeLeft = new BehaviorSubject<number>(0);
  private autoRefresh = new BehaviorSubject<boolean>(false);
  private store = inject(Store<AppState>);

  private initialTime: number;

  constructor() {}

  public getTimeLeft() {
    return this.timeLeft;
  }

  public getAutoRefresh() {
    // Wymusza odświeanie drzewka w treewiew jak timer na widoku procesu osiągnie 0 to autoRefresh jest trigerowany po prze metode refresh
    return this.autoRefresh;
  }

  public startTimer(timeToCount: number) {
    if (this.interval) return;

    this.initialTime = timeToCount;
    this.timeLeft.next(timeToCount);

    this.interval = setInterval(() => {
      const value = this.timeLeft.value;

      if (value > 0) {
        this.timeLeft.next(value - 1000);
      } else {
        // Trigeruje autoRefresh i ustawia timeLeft na domyslną wartość z environment
        this.refresh();
      }
    }, 1000);
  }

  public refresh() {
    this.autoRefresh.next(true);
    this.timeLeft.next(this.initialTime);
    this.store.dispatch(ProjectActions.signalTreeDataRefresh());
  }
}
