import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../common/store/app-state.model';
import { selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';

@Component({
  selector: 'rolap-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss'],
})
export class CompareComponent implements OnInit, OnDestroy {
  public projectId: number;
  public dataSetId: number;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store
      .select(selectCurrentV2TabIds)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((ids) => {
        if (!ids) return;
        this.dataSetId = ids.dataSetId!;
        this.projectId = ids.projectId!;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
