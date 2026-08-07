import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { ReplaySubject, Subject, Subscription, combineLatest, of } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { max } from 'lodash';
import { DatasetChartsService } from 'projects/rolap/src/app/main/project/dataset-charts/service/dataset-charts.service';
import { HistogramElement } from 'projects/rolap/src/app/main/project/models/project';

const Plotly = (window as any).Plotly;

@Component({
  selector: 'rolap-regression-conditions-coverage-plot',
  templateUrl: './regression-conditions-coverage-plot.component.html',
  styleUrls: ['./regression-conditions-coverage-plot.component.scss'],
})
export class RegressionConditionsCoveragePlotComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('histogramElement') histogramElement: ElementRef<HTMLElement>;
  @Input() dataSetId: number;
  @Input() decisionAttributeName: string;
  @Input() data: {
    covered_y_mean: number;
    covered_y_std: number;
    covered_y_min: number;
    covered_y_max: number;
  };
  public numberOfBins = 20;
  private histogramData: HistogramElement | undefined;
  public viewInitialized: ReplaySubject<boolean> = new ReplaySubject(1);
  private ngUnsubscribe: Subject<void> = new Subject();
  private histogramDataSubscription: Subscription;
  private plotParametersFactory = () => ({
    showlegend: false,
    yaxis: {
      title: this.translate.instant('visualisation.coverage_table_columns.number_of_occurrences'),
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
    bargap: 0.0,
    font: {
      family: 'Arial, sans-serif',
      size: 14,
      color: '#2c3e50',
    },
  });

  constructor(private translate: TranslateService, private chartsService: DatasetChartsService) {}

  ngOnInit(): void {
    combineLatest([this.viewInitialized, this.translate.onLangChange])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        if (this.histogramData) {
          this.drawHistogram();
        }
      });

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.dataSetId) {
      this.fetchData();
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized.next(true);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private fetchData() {
    this.histogramDataSubscription?.unsubscribe();
    this.histogramDataSubscription = this.chartsService
      .getHistogramData(this.dataSetId, this.numberOfBins)
      .pipe(
        map((data: HistogramElement[]) => {
          return data.find((element) => element.attribute_name === this.decisionAttributeName);
        }),
        switchMap((data: HistogramElement | undefined) => {
          if (!data) return of(undefined);
          this.histogramData = data;
          return of(data);
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((data) => {
        if (data) {
          this.drawHistogram();
        } else {
          console.warn('No histogram data found for the given decision attribute name.');
        }
      });
  }

  private drawHistogram() {
    if (!this.histogramData) {
      console.warn('Cannot draw histogram: histogramData is undefined');
      return;
    }

    const x = this.histogramData.division;
    const y = this.histogramData.counts;

    if (!x || !y) {
      console.warn('Cannot draw histogram: division or counts are undefined');
      return;
    }

    const maxY: number = max(this.histogramData.counts) || 0;
    const boxPlotX = [
      this.data.covered_y_min,
      this.data.covered_y_mean - this.data.covered_y_std,
      this.data.covered_y_mean - this.data.covered_y_std,
      this.data.covered_y_mean,
      this.data.covered_y_mean + this.data.covered_y_std,
      this.data.covered_y_mean + this.data.covered_y_std,
      this.data.covered_y_max,
    ];
    const boxPlotY: number[] = [];
    boxPlotX.forEach(() => boxPlotY.push(maxY));

    const plotData: number[] = [];
    for (let i = 0; i < y.length; i++) {
      for (let j = 0; j < y[i]; j++) {
        plotData.push((x[i] + x[i + 1]) / 2);
      }
    }

    Plotly.newPlot(
      this.histogramElement.nativeElement,
      [
        {
          x: boxPlotX,
          hoverinfo: 'none',
          type: 'box',
          marker: {
            color: '#c1572a',
          },
          width: 20,
        },
        {
          x: plotData,
          type: 'histogram',
          histnorm: 'count',
          autobinx: false,
          xbins: {
            start: x[0],
            end: x[x.length - 1],
            size: x[1] - x[0],
          },
          marker: {
            color: 'rgba(58, 200, 225, 0.8)',
            line: {
              color: 'rgba(58, 100, 225, 1)',
              width: 1,
            },
          },
          opacity: 0.7,
          checked: false,
        },
      ],
      {
        responsive: true,
        xaxis: {
          title: this.translate.instant('visualisation.coverage_table_columns.decision_attribute_value'),
          tickvals: x, // Set the tick values to be your bin edges
          ticktext: x.map((val) => val.toFixed(2)), // Optionally format the tick labels
          gridcolor: 'rgba(200, 200, 200, 0.2)',
          zerolinecolor: 'rgba(200, 200, 200, 0.5)',
          automargin: true,
          autosize: false,
        },
        ...this.plotParametersFactory(),
      },
    );
  }

  private handleResize(): void {
    if (this.histogramData) {
      this.drawHistogram();
    }
  }
}
