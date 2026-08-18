import { createActionGroup, props } from '@ngrx/store';

import { sortField, sortTypes } from './projectSearch.types';

export const ProjectSearchActions = createActionGroup({
  source: 'Project Search Actions',
  events: {
    'Set Sort projects': props<{ field: sortField }>(),
    'Set Sort projects complete': props<{ field: sortField; sortType: sortTypes }>(),
    'Set Search value': props<{ searchValue: string }>(),
  },
});
