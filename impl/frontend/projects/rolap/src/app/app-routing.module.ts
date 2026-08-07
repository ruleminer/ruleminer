import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from './common/guards/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./main/main.module').then((mod) => mod.MainModule),
    canLoad: [AuthGuardService],
  },
  { path: '', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { paramsInheritanceStrategy: 'always' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
