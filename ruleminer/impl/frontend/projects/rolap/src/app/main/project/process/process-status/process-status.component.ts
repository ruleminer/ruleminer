import { Component, Input } from '@angular/core';

import { ProcessStatus } from '../models/process.model';

@Component({
  selector: 'rolap-process-status',
  templateUrl: './process-status.component.html',
  styleUrls: ['./process-status.component.scss'],
})
export class ProcessStatusComponent {
  @Input() status: ProcessStatus;

  public processStatus = ProcessStatus;
}
