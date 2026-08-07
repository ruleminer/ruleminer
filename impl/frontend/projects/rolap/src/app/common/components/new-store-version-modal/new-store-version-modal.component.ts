import { Component } from '@angular/core';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { Modal } from '../../services/modal/modal';
import { AppState } from '../../store/app-state.model';

@Component({
  selector: 'rolap-new-store-version-modal',
  templateUrl: './new-store-version-modal.component.html',
  styleUrls: ['./new-store-version-modal.component.scss'],
  standalone: true,
  imports: [TranslateModule, DxButtonModule],
})
export class NewStoreVersionModalComponent {
  constructor(public modal: Modal<NewStoreVersionModalComponent>, private store: Store<AppState>) {}

  public close() {
    this.modal.close();
  }
}
