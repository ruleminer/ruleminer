import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { timer } from 'rxjs';

import { ProcessStatus } from '../../models/process.model';
import { ProcessDetailService } from '../../services/process-detail.service';

@Component({
  selector: 'rolap-process-info-table',
  templateUrl: './process-info-table.component.html',
  styleUrls: ['./process-info-table.component.scss'],
})
export class ProcessInfoTableComponent {
  private processDetailsService = inject(ProcessDetailService);
  public processDetailsSignal = this.processDetailsService.processDetailsSignal;

  private intervalSignal = toSignal(timer(0, 1000));

  // /**
  //  * Calculate time from start to end of generating process.
  //  */
  public executionTime = computed(() => {
    const details = this.processDetailsSignal();
    if (!details || !details.finish_timestamp) return null;
    const finishTimestamp = new Date(details.finish_timestamp).getTime();
    const startTimestamp = new Date(details.start_timestamp).getTime();
    return finishTimestamp - startTimestamp;
  });

  /**
   * Waiting time calculation.
   */
  public waitingTime = computed(() => {
    const interval = this.intervalSignal();
    const details = this.processDetailsSignal();

    if (!interval || !details) return null;

    if ([ProcessStatus.started, ProcessStatus.stopping].includes(details.status) && !details.finish_timestamp) {
      const startTimestamp = new Date(details.start_timestamp).getTime();

      return new Date().getTime() - startTimestamp;
    }
    return null;
  });
}
