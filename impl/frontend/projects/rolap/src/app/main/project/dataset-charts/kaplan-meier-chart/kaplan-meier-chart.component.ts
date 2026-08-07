import { Component, ElementRef, Input, ViewChild } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { DatasetService } from '../../dataset/service/dataset.service';

const Plotly = (window as any).Plotly;

@Component({
  selector: 'rolap-kaplan-meier-chart',
  templateUrl: './kaplan-meier-chart.component.html',
  styleUrls: ['./kaplan-meier-chart.component.scss'],
})
export class KaplanMeierChartComponent {
  @Input() dataSetId: number;
  @ViewChild('kaplanMeierChart', { static: true }) kaplanMeierChart: ElementRef<HTMLElement>;
  private resizeListener: () => void;
  private ngUnsubscribe = new Subject<void>();
  constructor(private datasetService: DatasetService, private translateService: TranslateService) {}

  ngOnInit(): void {
    this.datasetService
      .getKaplanMeierCurve(this.dataSetId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        const { time, probability } = data;
        this.draw(time, probability);
        this.resizeListener = () => this.draw(time, probability);
        window.addEventListener('resize', this.resizeListener);
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    window.removeEventListener('resize', this.resizeListener);
  }

  private draw(x: number[], y: number[]): void {
    if (!x && y!) return;

    const plotData = [
      {
        x,
        y,
        type: 'scatter',
        showscale: true,
        marker: { size: 12 },
      },
    ];

    const layout = {
      annotations: [],
      responsive: true,
      xaxis: {
        title: {
          text: this.translateService.instant('visualisation.kaplan_meier.x_axis_title'),
          standoff: 20,
        },
        side: 'bottom',
        autosize: true,
        automargin: true,
      },
      yaxis: {
        title: {
          text: this.translateService.instant('visualisation.kaplan_meier.y_axis_title'),
          standoff: 20,
        },
        ticks: '',
        ticksuffix: '',
        autosize: true,
        automargin: true,
      },
    };

    Plotly.newPlot(this.kaplanMeierChart.nativeElement, plotData, layout);
  }
}
