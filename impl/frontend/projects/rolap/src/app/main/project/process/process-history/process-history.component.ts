import { Component, inject } from '@angular/core';

import { ProcessStatus } from '../models/process.model';
import { ProcessDetailService } from '../services/process-detail.service';

@Component({
  selector: 'rolap-process-history',
  templateUrl: './process-history.component.html',
  styleUrls: ['./process-history.component.scss'],
})
export class ProcessHistoryComponent {
  public processDetailsService = inject(ProcessDetailService);

  public processDetailsSignal = this.processDetailsService.processDetailsSignal;

  public processStatus = ProcessStatus;
}
