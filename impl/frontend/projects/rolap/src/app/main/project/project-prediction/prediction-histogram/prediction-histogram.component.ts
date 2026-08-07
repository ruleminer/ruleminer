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

import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { AppState } from '../../../../common/store/app-state.model';

const Plotly = (window as any).Plotly;
@Component({
  selector: 'rolap-prediction-histogram',
  templateUrl: './prediction-histogram.component.html',
  styleUrls: ['./prediction-histogram.component.scss'],
})
export class PredictionHistogramComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('predictionHistogramElement') histogramElement: ElementRef<HTMLElement>;
  @Input() histogramData: { bin_edges: number[]; histogram: number[]; min: number; max: number };
  private ngUnsubscribe: Subject<void> = new Subject();
  constructor(private translate: TranslateService, private store: Store<AppState>) {}

  ngOnInit() {
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.drawHistogram();
    });

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngAfterViewInit() {
    if (!this.histogramElement.nativeElement) return;
    this.drawHistogram();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['histogramData'] &&
      this.histogramData &&
      this.histogramElement &&
      this.histogramElement.nativeElement
    ) {
      this.drawHistogram();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private drawHistogram(): void {
    const data: any[] = [];
    const x: number[] = this.histogramData.bin_edges;
    const y: number[] = this.histogramData.histogram;
    const plotData: number[] = [];

    for (let i = 0; i < y.length; i++) {
      for (let j = 0; j < y[i]; j++) {
        plotData.push((x[i] + x[i + 1]) / 2);
      }
    }

    data.push({
      x: plotData,
      type: 'histogram',
      autobinx: false,
      xbins: {
        start: x[0],
        end: x[x.length - 1],
        size: x[1] - x[0],
      },
      opacity: 0.6,
      marker: {
        line: { color: 'rgba(0,0,0,0.6)', width: 1 },
      },
    });

    const filteredTickVals: number[] = x.filter((_, index) => index % 2 === 0);
    const filteredTickText: string[] = filteredTickVals.map((val) => val.toFixed(2));

    const layout: any = {
      responsive: true,
      barmode: 'overlay',
      legend: {
        x: 0,
        xanchor: 'left',
        y: -0.4,
      },
      yaxis: {
        title: this.translate.instant('project.prediction.histogram.y_label'),
      },
      xaxis: {
        title: this.translate.instant('project.prediction.histogram.x_label'),
        range: [x[0], x[x.length - 1]],
        tickvals: filteredTickVals,
        ticktext: filteredTickText,
        gridcolor: 'rgba(200, 200, 200, 0.2)',
        zerolinecolor: 'rgba(200, 200, 200, 1)',
        zeroline: true,
        zerolinewidth: 3,
        tickangle: 45,
      },
    };

    Plotly.newPlot(this.histogramElement.nativeElement, data, layout);
  }

  private handleResize(): void {
    this.drawHistogram();
  }
}
