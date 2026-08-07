import { Component, Input, OnChanges } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { ProcessService } from 'projects/rolap/src/app/common/services/processes/process.service';

import { ProcessStatus } from '../models/process.model';
import { TimerService } from '../services/timer.service';

@Component({
  selector: 'rolap-process-abort-button',
  templateUrl: './process-abort-button.component.html',
  styleUrls: ['./process-abort-button.component.scss'],
})
export class ProcessAbortButtonComponent implements OnChanges {
  @Input() processId: number;
  @Input() status: ProcessStatus;

  public shouldDisplay = false;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private processService: ProcessService, private timerService: TimerService) {}

  ngOnChanges() {
    this.shouldDisplay = [ProcessStatus.started, ProcessStatus.pending].includes(this.status);
  }

  public abortProcess() {
    this.processService
      .abortTask(this.processId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        error: (err) => {
          if (err.error.err_msg_id === 'task_already_completed') {
            this.timerService.refresh();
          }

          throw err;
        },
        complete: () => {
          this.timerService.refresh();
        },
      });
  }
}
