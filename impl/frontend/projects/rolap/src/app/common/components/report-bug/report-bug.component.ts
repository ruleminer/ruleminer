import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { filterOutNullish } from '../../utils/rxjsUtils';
import { Subject, catchError, of, switchMap, take, takeUntil, tap } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCamera } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxButtonModule, DxCheckBoxModule, DxLoadPanelModule, DxTextAreaModule } from 'devextreme-angular';

import { FilterBuilderContainerComponent } from '../../filter-builder/components/filter-builder-container/filter-builder-container.component';
import { Modal } from '../../services/modal/modal';
import { ModalService } from '../../services/modal/modal.service';
import { NotifyService } from '../../services/notify/notify.service';
import { AppState } from '../../store/app-state.model';
import {
  setBugReportScreenshot,
  setBugReportScreenshotError,
  setBugReportState,
} from '../../store/bugReport/bugReport.action';
import { bugReportStateSelector } from '../../store/bugReport/bugReport.selectors';
import { BugReportState, ScreenshotErrorsReasons } from '../../store/bugReport/types';
import { InfoComponent } from '../info/info.component';
import { TextAreaComponent } from '../text-area/text-area.component';
import { ValidationMessageModule } from '../validation-message/validation-message.module';
import { BugReportScreenshotDisplayComponent } from './bug-report-screenshot-display/bug-report-screenshot-display.component';
import { ReportBugThankYouComponent } from './report-bug-thank-you/report-bug-thank-you.component';
import { BugReportingService } from './service/bug-reporting.service';
import { ScreenshotService } from './service/screenshot.service';
import { ScreenshotError } from './service/types';

@Component({
  selector: 'rolap-report-bug',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    FontAwesomeModule,
    DxButtonModule,
    DxLoadPanelModule,
    DxCheckBoxModule,
    DxTextAreaModule,
    InfoComponent,
    BugReportScreenshotDisplayComponent,
    ValidationMessageModule,
    TextAreaComponent,
    FilterBuilderContainerComponent,
  ],
  templateUrl: './report-bug.component.html',
  styleUrls: ['./report-bug.component.scss'],
})
export class ReportBugComponent implements OnInit, OnDestroy {
  public readonly MAX_DESCRIPTION_LENGTH = 3000;

  @Input() freshStart = false;

  public form: FormGroup;
  public screenshotAvailable = false;
  public showPermissionDeniedInfo = false;
  public screenshotIcon = faCamera;
  public isSubmitting = false;
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private modal: ModalService,
    private bugBugReportingService: BugReportingService,
    private translate: TranslateService,
    private modalRef: Modal<ReportBugComponent>,
    private screenshotService: ScreenshotService,
    private store: Store<AppState>,
    private notifyService: NotifyService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.screenshotAvailable = this.screenshotService.checkIfScreenshotIsAvailable();
    this.buildForm();

    if (this.freshStart) {
      // clear store
      this.store.dispatch(setBugReportState(this.form.value));
    } else {
      this.loadDataFromStore();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public submit() {
    this.isSubmitting = true;
    this.form.disable();
    this.bugBugReportingService
      .reportBug(this.form.value)
      .pipe(
        catchError(() => {
          this.isSubmitting = false;
          this.form.enable();
          this.handleSubmitError();
          return of(null);
        }),
        filterOutNullish(),
        tap(() => {
          this.modalRef.close();
        }),
        switchMap(() => {
          return this.modal.open(ReportBugThankYouComponent, this.translate.instant('report_bug.thank_you.title'));
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => {
        this.isSubmitting = false;
        this.form.enable();
        this.changeDetector.detectChanges();
      });
  }

  public cancel() {
    this.modalRef.close();
  }

  public async takeScreenshot() {
    this.modalRef.close();
    // wait for modal to close
    setTimeout(() => {
      this.screenshotService
        .takeScreenshot()
        .then((screenshotBase64Image: string) => {
          this.store.dispatch(setBugReportScreenshot(screenshotBase64Image));
          this.reopenModal();
        })
        .catch(this.handleScreenshotError.bind(this));
    }, 200);
  }

  private buildForm() {
    this.form = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(this.MAX_DESCRIPTION_LENGTH)]],
      allow_contact: [false, [Validators.required]],
      screenshot: [null],
    });
    this.form.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.store.dispatch(setBugReportState(this.form.value));
    });
  }

  private loadDataFromStore() {
    this.store
      .select(bugReportStateSelector)
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe((state: BugReportState) => {
        this.form.patchValue(state);
        this.showPermissionDeniedInfo = state.screenshotError === ScreenshotErrorsReasons.PERMISSION_DENIED;
      });
  }

  private reopenModal() {
    const title = this.translate.instant('report_bug.modal.title');
    this.modal.open(
      ReportBugComponent,
      title,
      undefined,
      undefined,
      { freshStart: false },
      { closeOnBackdropClick: false, closeOnEscapeClick: false, position: 'center' },
    );
  }

  private handleScreenshotError(error: ScreenshotError) {
    this.store.dispatch(setBugReportScreenshotError(error.reason));
    if (error.reason !== ScreenshotErrorsReasons.PERMISSION_DENIED) {
      this.notifyService.showNotify(
        this.translate.instant(`report_bug.modal.screenshot_errors.${error.reason}`),
        'error',
      );
    }
    this.reopenModal();
  }

  private handleSubmitError() {
    this.notifyService.showNotify(this.translate.instant('report_bug.modal.error'), 'error');
  }
}
