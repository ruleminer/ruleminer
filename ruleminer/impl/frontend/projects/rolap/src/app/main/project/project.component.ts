import { Component, OnDestroy, OnInit } from '@angular/core';

import { filterOutNullish } from '../../common/utils/rxjsUtils';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';

import { Store } from '@ngrx/store';

import { AppState } from '../../common/store/app-state.model';
import { AccountUsageLimits } from '../../common/store/limits/limits.action';
import { ProblemTypes } from '../data-upload/utils/enums';
import { Project } from './models/project';
import { AccountService } from './service/account.service';
import { UserLimits } from './service/models/account.model';
import { ProjectService } from './service/project.service';

@Component({
  selector: 'rolap-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit, OnDestroy {
  public readonly ProblemTypes = ProblemTypes;
  public projects$: Observable<Project[]>;
  public isProjectLimitReached = false;
  public projectLimits: Pick<UserLimits, 'max_projects' | 'max_rulesets' | 'max_datasets' | 'max_reports'>;

  private ngUnsubscribe: Subject<void> = new Subject();
  private userLimitsSubscription: Subscription;

  constructor(
    private accountService: AccountService,
    private store: Store<AppState>,
    private projectService: ProjectService,
  ) {}

  ngOnInit() {
    this.projects$ = this.projectService.getProjects().pipe(shareReplay());
    this.fetchUserLimits();
  }

  ngOnDestroy(): void {
    this.userLimitsSubscription?.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private fetchUserLimits() {
    this.userLimitsSubscription?.unsubscribe();
    this.userLimitsSubscription = this.accountService
      .getUserLimits()
      .pipe(
        switchMap((limit) => {
          const { max_datasets, max_projects, max_reports, max_rulesets } = limit;
          const limits = { max_datasets, max_projects, max_reports, max_rulesets };
          this.store.dispatch(AccountUsageLimits.setLimits({ limits }));
          this.projectLimits = limits;
          return this.checkIfProjectLimitReached();
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((isReached) => {
        this.isProjectLimitReached = isReached;
      });
  }

  private checkIfProjectLimitReached(): Observable<boolean> {
    if (!this.projectLimits) return of(false);
    return this.projects$.pipe(
      filterOutNullish(),
      map((projects) => {
        const projectCount = projects.length;
        const { max_projects } = this.projectLimits;
        return projectCount >= max_projects;
      }),
    );
  }
  public onProjectDeleted(projectsLength: { projectsLength: number }): void {
    const { max_projects } = this.projectLimits;
    this.isProjectLimitReached = projectsLength.projectsLength >= max_projects;
  }
}
