import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { AppState } from '../../../store/app-state.model';
import { V2TabsActions } from '../../../store/v2Tabs/v2Tabs.action';
import { selectCurrentSubTabs } from '../../../store/v2Tabs/v2Tabs.selectors';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule],
  selector: 'rolap-sub-tab-buttons',
  templateUrl: './sub-tab-buttons.component.html',
  styleUrls: ['./sub-tab-buttons.component.scss'],
})
export class SubTabButtonsComponent {
  public items$ = this.store.select(selectCurrentSubTabs);

  constructor(private store: Store<AppState>) {}

  public onSubTabClick(index: number): void {
    this.store.dispatch(V2TabsActions.setCurrentSubTabIndex({ index }));
  }
}
