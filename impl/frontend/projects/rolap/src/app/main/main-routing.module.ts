import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from '../common/guards/auth-guard.service';
import { ModalGuard } from '../common/guards/profile.guard';
import { TourGuard } from '../common/guards/tour.guard';
import { MainComponent } from './main.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: 'home',
        loadChildren: () => import('./project/project.module').then((mod) => mod.ProjectModule),
                    canLoad: [AuthGuardService],
                    canDeactivate: [ModalGuard],
        canActivate: [TourGuard],
      },
      {
        path: 'projects',
        loadChildren: () => import('./project/project.module').then((mod) => mod.ProjectModule),
        canLoad: [AuthGuardService],
        canDeactivate: [ModalGuard],
      },
      {
        path: 'project-summary',
        loadChildren: () => import('./project-summary/project-summary.module').then((mod) => mod.ProjectSummaryModule),
              canLoad: [AuthGuardService],
              canDeactivate: [ModalGuard],
        canActivate: [TourGuard],
      },
      {
        path: 'profile',
              loadChildren: () => import('./profile/profile.module').then((mod) => mod.ProfileModule),
              canDeactivate: [ModalGuard],
        canActivate: [TourGuard],
      },
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      { path: '**', redirectTo: 'projects' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
