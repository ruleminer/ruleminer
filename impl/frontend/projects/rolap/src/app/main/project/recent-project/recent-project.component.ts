import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';

import { faArrowDown, faArrowUp, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { AppState } from '../../../common/store/app-state.model';
import { selectProjectSearch } from '../../../common/store/projectSearch/projectSearch.selector';
import { sortTypes } from '../../../common/store/projectSearch/projectSearch.types';
import { Project } from '../models/project';
import { ProjectService } from '../service/project.service';
import { sortField } from './types';

@Component({
  selector: 'rolap-recent-project',
  templateUrl: './recent-project.component.html',
  styleUrls: ['./recent-project.component.scss'],
})
export class RecentProjectComponent implements OnInit, OnDestroy {
  @Input() isProjectLimitReached: boolean;
  @Output() projectDeleted = new EventEmitter<{ projectsLength: number }>();

  public faIconPlus = faPlus;
  public faArrowUp = faArrowUp;
  public faArrowDown = faArrowDown;
  public sortField = sortField;

  public filteredProjects$: Observable<Project[]>;
  private refresh$ = new BehaviorSubject<void>(undefined);
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private store: Store<AppState>,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.setupFilteredProjects();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public openProjectSummary(): void {
    this.router.navigate(['/project-summary']);
  }

  public onProjectUpdated(): void {
    this.refresh$.next();
  }

  public onProjectDeleted(): void {
    this.refresh$.next();
    this.projectService
      .getProjects()
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe((projects) => {
        this.projectDeleted.emit({ projectsLength: projects.length });
      });
  }

  private setupFilteredProjects(): void {
    const projects$ = this.refresh$.pipe(
      switchMap(() => this.projectService.getProjects()),
      shareReplay(1),
    );

    const searchAndSort$ = this.store.select(selectProjectSearch);

    this.filteredProjects$ = combineLatest([projects$, searchAndSort$]).pipe(
      map(([projects, { searchValue, sortField: sortFieldValue, sortType }]) =>
        this.filterAndSortProjects(
          projects,
          searchValue,
          sortFieldValue ?? sortField.LAST_MODIFICATION,
          sortType ?? sortTypes.ASC,
        ),
      ),
      shareReplay(1),
    );
  }

  private filterAndSortProjects(
    projects: Project[],
    searchValue: string,
    sortFieldValue: sortField,
    sortType: sortTypes,
  ): Project[] {
    return projects
      .filter((project) => !searchValue || project.name.toLowerCase().includes(searchValue.toLowerCase()))
      .sort((a, b) => {
        const fieldA = this.getFieldValue(a, sortFieldValue);
        const fieldB = this.getFieldValue(b, sortFieldValue);
        return this.compareValues(fieldA, fieldB, sortType);
      });
  }

  private getFieldValue(project: Project, field: sortField): Date | string {
    switch (field) {
      case sortField.NAME:
        return project.name.toLowerCase();
      case sortField.LAST_OPENING:
        return new Date(project.last_opened_at);
      case sortField.LAST_MODIFICATION:
        return new Date(project.updated_at);
      default:
        return project.name.toLowerCase();
    }
  }

  private compareValues(a: Date | string, b: Date | string, sortType: sortTypes): number {
    if (a < b) return sortType === sortTypes.ASC ? -1 : 1;
    if (a > b) return sortType === sortTypes.ASC ? 1 : -1;
    return 0;
  }
}
