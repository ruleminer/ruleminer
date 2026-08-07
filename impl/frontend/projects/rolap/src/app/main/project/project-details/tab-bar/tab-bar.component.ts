import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subject, combineLatest, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { DxScrollViewComponent } from 'devextreme-angular';

import { AppState } from '../../../../common/store/app-state.model';
import { selectCurrentV2TabId } from '../../../../common/store/v2CurrentTab/v2CurrentTab.selectors';
import { V2Tab } from '../../../../common/store/v2Tabs/types';
import { selectAllV2Tabs } from '../../../../common/store/v2Tabs/v2Tabs.selectors';

@Component({
  selector: 'rolap-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent implements OnInit, OnDestroy {
  @ViewChild('scrollView') scrollView: DxScrollViewComponent;
  public v2Tabs: V2Tab[] = [];
  public v2CurrentTabId: string;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    combineLatest([this.store.select(selectCurrentV2TabId), this.store.select(selectAllV2Tabs)])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(([v2CurrentTabId, v2Tabs]) => {
        this.v2Tabs = v2Tabs;
        this.v2CurrentTabId = v2CurrentTabId;
        this.updateScrollView();
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private updateScrollView(): void {
    if (!this.scrollView) return;
    this.scrollView.instance.update();
  }
}
