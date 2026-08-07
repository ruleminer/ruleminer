import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { DxMultiViewModule } from 'devextreme-angular';

import { StepperStepHeaderComponent } from './components/stepper-step-header/stepper-step-header.component';
import { StepContentDirective, StepperStepComponent } from './components/stepper-step/stepper-step.component';
import { StepperComponent } from './stepper.component';

@NgModule({
  declarations: [StepperComponent, StepperStepComponent, StepContentDirective, StepperStepHeaderComponent],
  imports: [CommonModule, DxMultiViewModule],
  exports: [StepperComponent, StepperStepComponent, StepContentDirective],
})
export class StepperModule {}
