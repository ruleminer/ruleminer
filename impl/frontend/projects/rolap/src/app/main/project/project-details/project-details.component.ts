import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';

import { Store, createSelector } from '@ngrx/store';
import { isEqual } from 'lodash';

import { SidebarComponent } from '../../../common/components/sidebar/sidebar.component';
import { AppState } from '../../../common/store/app-state.model';
import { ProjectActions } from '../../../common/store/project/project.action';
import { sidebarWidthSelector } from '../../../common/store/sidebar/sidebar.reducer';
import { selectCurrentV2Tab } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { ProjectService } from '../service/project.service';

@Component({
  selector: 'rolap-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  @ViewChild(SidebarComponent, { static: false }) sidebar: SidebarComponent;
  public sidebarWidth = this.store.select(sidebarWidthSelector);
  public projectId: number | null;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  selectTabs = (state: AppState) => state.tabs;
  currentTabProjectId = this.store.select(selectCurrentV2Tab).pipe(map((tab) => tab?.ids.projectId as number));

  hasTabsSelector = createSelector(this.selectTabs, (tabs) => {
    const hasTabs = tabs && tabs.length > 0;
    return hasTabs;
  });

  public hasTabs$ = this.store
    .select(this.hasTabsSelector)
    .pipe(startWith(null), debounceTime(800), distinctUntilChanged(isEqual));

  public paramProjectId$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const projectId = params.get('projectId');
      if (!projectId) {
        return of(null);
      }

      this.validateAndSetValues(projectId);
      return of(Number(projectId));
    }),
    distinctUntilChanged(isEqual),
    shareReplay(1),
  );

  public getCurrentTabProjectId$ = this.currentTabProjectId.pipe(distinctUntilChanged(isEqual), shareReplay(1));

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
  ) {}

  ngOnInit() {
    combineLatest([this.getCurrentTabProjectId$.pipe(take(1)), this.paramProjectId$])
      .pipe(
        switchMap(([getCurrentTabProjectId, projectId]) =>
          this.projectService
            .getProject(Number(projectId))
            .pipe(map((project) => ({ project, getCurrentTabProjectId }))),
        ),
        distinctUntilChanged(isEqual),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(({ project, getCurrentTabProjectId }) => {
        this.projectId = project.id;
        if (this.projectId !== getCurrentTabProjectId) {
          const activeProject = {...project}
          this.store.dispatch(ProjectActions.setActiveProject({ activeProject }));
        }
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private validateAndSetValues(projectId: string): void {
    if (this.onlyContainsNumbers(projectId)) {
      this.projectId = parseInt(projectId);
    } else {
      this.projectId = null;
      this.router.navigate(['/']);
    }
  }

  private onlyContainsNumbers(str: string): boolean {
    return /^\d+$/.test(str);
  }
}
