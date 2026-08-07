import { Component, inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../common/store/app-state.model";
import { selectCurrentSubTabs } from "../../../../../common/store/v2Tabs/v2Tabs.selectors";

@Component({
  selector: 'rolap-current-dataset',
  templateUrl: './current-dataset.component.html',
  styleUrls: ['./current-dataset.component.scss'],
})
export class CurrentDatasetComponent {
  private store = inject(Store<AppState>);

  public subTabs$ = this.store.select(selectCurrentSubTabs);

}