import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { faArrowDown, faArrowUp } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../common/store/app-state.model';
import { ProjectSearchActions } from '../../../../common/store/projectSearch/projectSearch.action';
import { selectProjectSearch } from '../../../../common/store/projectSearch/projectSearch.selector';
import { sortTypes } from '../../../../common/store/projectSearch/projectSearch.types';
import { SortIcons, sortField } from '../types';

@Component({
  selector: 'rolap-sort-header',
  templateUrl: './sort-header.component.html',
  styleUrls: ['./sort-header.component.scss'],
})
export class SortHeaderComponent implements OnInit, OnDestroy {
  public currentSortField: string;
  public currentSortDirection: sortTypes | null;
  public readonly sortFields: sortField[] = [sortField.NAME, sortField.LAST_OPENING, sortField.LAST_MODIFICATION];

  public readonly translateKey = {
    [sortField.NAME]: 'project.name',
    [sortField.LAST_OPENING]: 'project.last_opening',
    [sortField.LAST_MODIFICATION]: 'project.last_modification',
  };

  public faArrowUp = faArrowUp;
  public faArrowDown = faArrowDown;
  public sortField = sortField;
  private ngUnsubscribe: Subject<void> = new Subject();

  public boldClasses: { [key: string]: boolean } = {
    [sortField.NAME]: false,
    [sortField.LAST_OPENING]: false,
    [sortField.LAST_MODIFICATION]: false,
  };

  public icons: SortIcons = {
    [sortField.NAME]: faArrowUp,
    [sortField.LAST_OPENING]: faArrowUp,
    [sortField.LAST_MODIFICATION]: faArrowUp,
  };

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store
      .select(selectProjectSearch)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((projectSearch) => {
        this.currentSortField = projectSearch.sortField || '';
        this.currentSortDirection = projectSearch.sortType;
        this.updateIcons();
        this.updateBoldClasses();
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private updateIcons(): void {
    for (const field in this.icons) {
      if (field === this.currentSortField) {
        this.icons[field as sortField] =
          this.currentSortDirection === sortTypes.ASC ? this.faArrowUp : this.faArrowDown;
      } else {
        this.icons[field as sortField] = null as any;
      }
    }
  }

  private updateBoldClasses() {
    for (const field in this.boldClasses) {
      this.boldClasses[field as sortField] = field === this.currentSortField;
    }
  }

  public sortProjects(field: sortField) {
    this.store.dispatch(ProjectSearchActions.setSortProjects({ field }));
  }
}
