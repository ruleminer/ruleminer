import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, filter, takeUntil } from 'rxjs';

import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { AppState } from '../../../common/store/app-state.model';
import { activeSurvivalProjectSelector } from '../../../common/store/project/project.selectors';
import { selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { PlotParameters } from './models/chart-models';

@Component({
  selector: 'rolap-dataset-charts',
  templateUrl: './dataset-charts.component.html',
  styleUrls: ['./dataset-charts.component.scss'],
})
export class DatasetChartsComponent implements OnInit, OnDestroy {
  /**
   * Common parameters for plots
   */

  public plotParameters: PlotParameters = {
    yaxis: {
      title: 'Number of occurances',
      gridcolor: 'rgba(200, 200, 200, 0.2)',
      zerolinecolor: 'rgba(200, 200, 200, 0.5)',
      automargin: true,
      autosize: false,
    },
    margin: {
      l: 80,
      r: 80,
      b: 20,
      t: 80,
      pad: 4,
    },
    bargap: 0.05,
    font: {
      family: 'Arial, sans-serif',
      size: 14,
      color: '#2c3e50',
    },
  };
  public loadingInfo = {
    correlation: true,
    histogram: true,
    barChart: true,
  };
  public dataSetId: number;
  private ngUnsubscribe = new Subject<void>();
  public isCorrelationMatrix = false;
  public isSurvival$ = this.store.select(activeSurvivalProjectSelector);
  constructor(private store: Store<AppState>, private translate: TranslateService) {}

  ngOnInit(): void {
    this.setChartTitle();

    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.setChartTitle();
    });

    this.store
      .pipe(select(selectCurrentV2TabIds))
      .pipe(
        filter((ids) => !!ids?.dataSetId),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((ids) => {
        if (!ids) return;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.dataSetId = ids.dataSetId!;
        this.isCorrelationMatrix = false;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setChartTitle() {
    this.plotParameters.yaxis.title = this.translate.instant('visualisation.plot_parameters.y_axis_title');
  }

  public handleCorrelationLoadingChange(isLoading: boolean): void {
    this.loadingInfo.correlation = isLoading;
  }
  public handleLoadingHistogramChange(isLoading: boolean): void {
    this.loadingInfo.histogram = isLoading;
  }
  public handleBarChartLoadingChange(isLoading: boolean): void {
    this.loadingInfo.barChart = isLoading;
  }
}
