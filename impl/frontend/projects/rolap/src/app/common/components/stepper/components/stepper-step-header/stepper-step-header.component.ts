import { Component, Input } from '@angular/core';

@Component({
  selector: 'rolap-stepper-step-header',
  templateUrl: './stepper-step-header.component.html',
  styleUrls: ['./stepper-step-header.component.scss'],
})
export class StepperStepHeaderComponent {
  @Input() stepNumber: number;
  @Input() active: boolean = false;
}
