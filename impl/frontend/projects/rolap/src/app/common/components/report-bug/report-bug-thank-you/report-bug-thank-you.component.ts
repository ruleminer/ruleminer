import { Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { Modal } from '../../../services/modal/modal';

@Component({
  selector: 'rolap-report-bug-thank-you',
  templateUrl: './report-bug-thank-you.component.html',
  standalone: true,
  imports: [DxButtonModule, TranslateModule],
  styleUrls: ['./report-bug-thank-you.component.scss'],
})
export class ReportBugThankYouComponent {
  constructor(private modalRef: Modal<ReportBugThankYouComponent>) {}

  public closeModal() {
    this.modalRef.close();
  }
}
