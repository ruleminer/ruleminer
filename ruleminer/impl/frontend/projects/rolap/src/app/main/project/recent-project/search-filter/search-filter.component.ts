import { Component } from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Observable, map } from 'rxjs';

import { Store } from '@ngrx/store';
import { InputEvent } from 'devextreme/ui/text_box';

import { AppState } from '../../../../common/store/app-state.model';
import { ProjectSearchActions } from '../../../../common/store/projectSearch/projectSearch.action';
import { selectProjectSearch } from '../../../../common/store/projectSearch/projectSearch.selector';
import { ProjectSearch } from '../../../../common/store/projectSearch/projectSearch.types';

@Component({
  selector: 'rolap-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss'],
})
export class SearchFilterComponent {
  public searchValue$: Observable<string> = this.store.select(selectProjectSearch).pipe(
    map((projectSearch: ProjectSearch) => projectSearch.searchValue),
    filterOutNullish(),
  );

  constructor(private store: Store<AppState>) {}
  private timeout: ReturnType<typeof setTimeout>;

  public onFilterChange(event: InputEvent): void {
    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      const target = event.event?.target as HTMLInputElement;
      const filterValue = (target.value || '').trim().toLowerCase();
      this.store.dispatch(ProjectSearchActions.setSearchValue({ searchValue: filterValue }));
    }, 250);
  }
}
