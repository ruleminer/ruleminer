import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { AppState } from '../../../store/app-state.model';
import { setBugReportScreenshot } from '../../../store/bugReport/bugReport.action';
import { bugReportStateSelector } from '../../../store/bugReport/bugReport.selectors';
import { BugReportState, ScreenshotErrorsReasons } from '../../../store/bugReport/types';
import { InfoComponent } from '../../info/info.component';

@Component({
  selector: 'rolap-bug-report-screenshot-display',
  standalone: true,
  imports: [CommonModule, TranslateModule, FontAwesomeModule, DxButtonModule, InfoComponent],
  templateUrl: './bug-report-screenshot-display.component.html',
  styleUrls: ['./bug-report-screenshot-display.component.scss'],
})
export class BugReportScreenshotDisplayComponent implements OnInit, OnDestroy {
  public screenshotBase64Image: string | null;
  public showPermissionDeniedInfo = false;
  public screenshotRemoveIcon = faTrash;
  private ngUnsubscribe = new Subject<void>();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store
      .select(bugReportStateSelector)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BugReportState) => {
        if (state.screenshotError) {
          this.handleScreenshotError(state.screenshotError);
        } else {
          this.screenshotBase64Image = state.screenshot;
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public removeScreenshot() {
    this.store.dispatch(setBugReportScreenshot(null));
  }

  private handleScreenshotError(reason: ScreenshotErrorsReasons) {
    if (reason === ScreenshotErrorsReasons.PERMISSION_DENIED) {
      this.showPermissionDeniedInfo = true;
    }
  }
}
