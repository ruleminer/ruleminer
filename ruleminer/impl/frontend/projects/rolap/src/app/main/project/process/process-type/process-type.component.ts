import { Component, Input } from '@angular/core';

import { ProcessType } from '../models/process.model';

@Component({
  selector: 'rolap-process-type',
  templateUrl: './process-type.component.html',
  styleUrls: ['./process-type.component.scss'],
})
export class ProcessTypeComponent {
  @Input() type: ProcessType;

  public processType = ProcessType;
}
