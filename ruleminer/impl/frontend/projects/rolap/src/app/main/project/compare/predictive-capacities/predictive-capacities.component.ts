import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, switchMap, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../common/store/app-state.model';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { DatasetService } from '../../dataset/service/dataset.service';

@Component({
  selector: 'rolap-predictive-capacities',
  templateUrl: './predictive-capacities.component.html',
  styleUrls: ['./predictive-capacities.component.scss'],
})
export class PredictiveCapacitiesComponent implements OnInit, OnDestroy {
  public datasetName: string;
  private ngUnsubscribe = new Subject<void>();

  constructor(private store: Store<AppState>, private datasetService: DatasetService) {}

  ngOnInit() {
    this.store
      .select(selectCurrentV2TabIds)
      .pipe(
        switchMap((ids) => this.datasetService.getDatasetInfo(ids?.dataSetId!)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((res) => {
        this.datasetName = res.name;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
