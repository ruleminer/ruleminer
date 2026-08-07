import { Component, DestroyRef, Input, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { filter, switchMap } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { environment } from '../../../../environments/environment';
import { OpenTourComponent } from '../../../common/components/tour/open-tour/open-tour.component';
import { TourApiService } from '../../../common/components/tour/tour-api.service';
import { TourService } from '../../../common/components/tour/tour.service';
import { ModalRef } from '../../../common/services/modal/modal-ref';
import { ModalConfig, ModalPositions, ModalService } from '../../../common/services/modal/modal.service';
import { NotifyService } from '../../../common/services/notify/notify.service';
import { Project } from '../../project/models/project';
import { UserLimits } from '../../project/service/models/account.model';
import { ProjectService } from '../../project/service/project.service';

@Component({
  selector: 'rolap-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent {
  @Input() email: string;
  @Input() limits: UserLimits;
  public resetPasswordHref: string;
  private tourApiService = inject(TourApiService);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  private notifyService = inject(NotifyService);
  private tourService = inject(TourService);
  private modalService = inject(ModalService);

  private projects = signal<Project[]>([]);

  public isDisabled = computed(() => {
    const currentProjectsCount = this.projects().length;
    const maxProjects = this.limits?.max_projects ?? 0;
    return currentProjectsCount >= maxProjects;
  });

  ngOnInit() {
    this.createResetPasswordHref();
    this.loadProjects();
  }

  private loadProjects() {
    this.projectService
      .getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projects) => {
        this.projects.set(projects);
      });
  }

  private createResetPasswordHref() {
    const {
      keycloak: { clientId, realm, url },
    } = environment;

    this.resetPasswordHref = `${url}/realms/${realm}/login-actions/reset-credentials?client_id=${clientId}`;
  }

  public repeatTutorial() {
    this.tourApiService
      .removeTour()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/home']).then(() => {
            setTimeout(() => this.openTourModal(), 500);
          });
        },
        error: () => {
          this.notifyService.showNotify(this.translate.instant('tour.config.repeat.error'), 'error');
        },
      });
  }

  private openTourModal() {
    const config: ModalConfig = {
      closeOnBackdropClick: true,
      position: ModalPositions.CENTER,
      closeOnEscapeClick: false,
    };

    this.modalService
      .open(OpenTourComponent, 'tour.config.title', '400px', undefined, null, config, null, true)
      .pipe(
        switchMap((modalRef: ModalRef<OpenTourComponent>) => {
          return modalRef.getResult();
        }),
        filter((res: any) => res === true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.tourService.startTour(0);
      });
  }
}
