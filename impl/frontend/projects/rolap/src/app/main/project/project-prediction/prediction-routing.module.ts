import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectPredictionComponent } from './project-prediction.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectPredictionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PredictionRoutingModule {}
