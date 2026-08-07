import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';

import { ProjectSummaryRefreshService } from '../services/project-summary-refresh/project-summary-refresh.service';

@Component({
  selector: 'rolap-project-summary-refresh-btn',
  templateUrl: './project-summary-refresh-btn.component.html',
  styleUrls: ['./project-summary-refresh-btn.component.scss'],
})
export class ProjectSummaryRefreshBtnComponent implements OnInit, OnDestroy {
  public isRefreshing: boolean;
  public faArrowsRotate = faArrowsRotate;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private projectSummaryRefreshService: ProjectSummaryRefreshService) {}

  ngOnInit(): void {
    this.observeRefreshState();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public refresh() {
    this.projectSummaryRefreshService.setRefreshState(true);
  }

  private observeRefreshState() {
    this.projectSummaryRefreshService
      .getRefreshState()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.isRefreshing = res;
      });
  }
}
