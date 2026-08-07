import { createReducer, on } from '@ngrx/store';

import { ProjectSearchActions } from './projectSearch.action';
import { ProjectSearch, sortField, sortTypes } from './projectSearch.types';

const initialState: ProjectSearch = {
  sortField: sortField.LAST_OPENING,
  sortType: sortTypes.DESC,
  searchValue: '',
};

export const projectSearchReducer = createReducer(
  initialState,
  on(ProjectSearchActions.setSortProjects, (state, action) => state),
  on(ProjectSearchActions.setSortProjectsComplete, (state, action) => ({
    ...state,
    sortField: action.field,
    sortType: action.sortType,
  })),
  on(ProjectSearchActions.setSearchValue, (state, { searchValue }) => ({
    ...state,
    searchValue: searchValue,
  })),
);
