import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subject, filter, switchMap, takeUntil } from 'rxjs';

import { AccountService } from '../project/service/account.service';
import { UserLimits } from '../project/service/models/account.model';
import { ProjectSummaryRefreshService } from './services/project-summary-refresh/project-summary-refresh.service';

@Component({
  selector: 'rolap-project-summary',
  templateUrl: './project-summary.component.html',
  styleUrls: ['./project-summary.component.scss'],
})
export class ProjectSummaryComponent implements OnInit, OnDestroy {
  public limits: UserLimits;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private router: Router,
    private accountService: AccountService,
    private projectSummaryRefreshService: ProjectSummaryRefreshService,
  ) {}

  ngOnInit(): void {
    this.getUserLimits();
    this.observeRefreshState();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onBackBtnClick() {
    this.router.navigate(['/home']);
  }

  private observeRefreshState() {
    this.projectSummaryRefreshService
      .getRefreshState()
      .pipe(
        filter((x) => x === true),
        switchMap(() => this.accountService.getUserLimits()),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((res) => {
        this.limits = res;
      });
  }

  private getUserLimits() {
    this.accountService
      .getUserLimits()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.limits = res;
      });
  }
}
