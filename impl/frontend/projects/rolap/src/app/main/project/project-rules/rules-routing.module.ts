import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectRulesComponent } from './project-rules.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectRulesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RulesRoutingModule {}
