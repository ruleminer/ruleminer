import { Component } from '@angular/core';

import { filterOutNullish } from '../../../../../utils/rxjsUtils';

import { Store } from '@ngrx/store';
import { ValueChangedEvent } from 'devextreme/ui/text_box';

import { AppState } from '../../../../../store/app-state.model';
import { V2VisualizationTabActions } from '../../../../../store/v2VisualizationTab/v2VisualizationTab.action';
import { selectCurrentV2VisualizationTabSearchValue } from '../../../../../store/v2VisualizationTab/v2VisualizationTab.selectors';

@Component({
  selector: 'rolap-rules-and-conditions-search',
  templateUrl: './rules-and-conditions-search.component.html',
  styleUrls: ['./rules-and-conditions-search.component.scss'],
})
export class RulesAndConditionsSearchComponent {
  public searchTerm$ = this.store.select(selectCurrentV2VisualizationTabSearchValue).pipe(filterOutNullish());

  constructor(private store: Store<AppState>) {}

  /**
   * Handles the search term change event and dispatches an action to set the search value in the store.
   *
   * @param event - The event containing the new search term value.
   */
  onSearchTermChange(event: ValueChangedEvent): void {
    const searchValue = event.value;
    this.store.dispatch(V2VisualizationTabActions.setSearchValue({ searchValue }));
  }
}
