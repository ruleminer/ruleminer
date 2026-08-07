import { AfterViewInit, Directive, OnDestroy, OnInit } from '@angular/core';

import { ReplaySubject, Subject, interval, takeUntil, throttle } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../common/store/app-state.model';
import { sidebarWidthSelector } from '../../../common/store/sidebar/sidebar.reducer';

@Directive()
export abstract class AbstractDatasetChartComponent implements OnInit, AfterViewInit, OnDestroy {
  protected ngUnsubscribe = new Subject<void>();
  protected viewInitialized = new ReplaySubject<void>();
  private windowOnResizeListener: () => void = this.handleResize.bind(this);
  private sidebarWidthSelector = this.store.select(sidebarWidthSelector);

  constructor(protected store: Store<AppState>) {}
  ngAfterViewInit(): void {
    this.viewInitialized.next();
  }

  ngOnInit(): void {
    this.sidebarWidthSelector
      .pipe(
        throttle(() => interval(200)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => this.handleResize());

    window.addEventListener('resize', this.windowOnResizeListener);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.viewInitialized.complete();
    window.removeEventListener('resize', this.windowOnResizeListener);
  }

  protected abstract draw(): void;

  protected handleResize(): void {}
}
