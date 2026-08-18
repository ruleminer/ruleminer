import { Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../common/store/app-state.model';
import { selectCurrentV2Tab } from '../../../../common/store/v2Tabs/v2Tabs.selectors';

@Component({
  selector: 'rolap-display-currently-selected-tab',
  templateUrl: './display-currently-selected-tab.component.html',
  styleUrls: ['./display-currently-selected-tab.component.scss'],
})
export class DisplayCurrentlySelectedTabComponent {
  public v2CurrentTab$ = this.store.select(selectCurrentV2Tab);
  constructor(private store: Store<AppState>) {}
}
