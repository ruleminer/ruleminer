import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';

import { environment } from '../../../../../environments/environment';
import { TimerService } from '../services/timer.service';

@Component({
  selector: 'rolap-process-refresh-btn',
  templateUrl: './process-refresh-btn.component.html',
  styleUrls: ['./process-refresh-btn.component.scss'],
})
export class ProcessRefreshBtnComponent implements OnInit, OnChanges {
  @Input() isRefreshing: boolean;
  public faArrowsRotate = faArrowsRotate;
  public timeLeft$: BehaviorSubject<number>;

  constructor(private timerService: TimerService) {}

  ngOnInit(): void {
    this.timeLeft$ = this.timerService.getTimeLeft();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isRefreshing'] && changes['isRefreshing'].currentValue === false) {
      this.timerService.startTimer(environment.refreshTimer);
    }
  }

  public refresh() {
    this.timerService.refresh();
  }
}