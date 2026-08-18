import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { Subject, switchMap, takeUntil } from 'rxjs';

import { Store, select } from '@ngrx/store';

import { AppState } from '../../../common/store/app-state.model';
import { selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { ReportService } from '../service/report.service';

@Component({
  selector: 'rolap-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit, OnDestroy {
  public srcDoc: string;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>, private reportService: ReportService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.store
      .pipe(
        select(selectCurrentV2TabIds),
        switchMap((ids) => this.reportService.getReportFrameSrcDoc(ids?.reportId!)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((srcDoc) => {
        // PENDING REVIEW - perhaps this should rather be handled
        // by setting appropriate Content-Security-Policy in our app
        this.srcDoc = this.sanitizer.bypassSecurityTrustHtml(srcDoc) as string;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
