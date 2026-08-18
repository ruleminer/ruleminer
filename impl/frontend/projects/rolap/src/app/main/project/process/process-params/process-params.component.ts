import { Component, Input } from '@angular/core';

@Component({
  selector: 'rolap-process-params',
  templateUrl: './process-params.component.html',
  styleUrls: ['./process-params.component.scss'],
})
export class ProcessParamsComponent {
  @Input() param: [string, any];
}
