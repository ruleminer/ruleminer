import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Subscription, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxNumberBoxModule, DxRadioGroupModule } from 'devextreme-angular';
import { CardModule } from 'projects/rolap/src/app/common/components/card/card.module';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { HistogramElement } from '../../models/project';
import { AbstractDatasetChartComponent } from '../abstract-dataset-chart-component';
import { DatasetChartsService } from '../service/dataset-charts.service';

@Component({
  selector: 'rolap-dataset-histogram-chart',
  standalone: true,
  imports: [CommonModule, CardModule, FormsModule, TranslateModule, DxNumberBoxModule, DxRadioGroupModule],
  templateUrl: './dataset-histogram-chart.component.html',
  styleUrls: ['./dataset-histogram-chart.component.scss'],
})
export class DatasetHistogramChartComponent
  extends AbstractDatasetChartComponent
  implements OnInit, OnChanges, OnDestroy
{
  public readonly MIN_BINS = 2;
  public readonly MAX_BINS = 50;

  @Input() dataSetId: number;
  @Input() plotParameters: { [key: string]: any };
  @Output() correlationMatrixVisibilityChange: EventEmitter<boolean> = new EventEmitter();
  @Output() histogramLoadingChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  public numberOfBins: number;
  public histogramElements: HistogramElement[] = [];
  public showHistogram = false;
  public selectedElement: HistogramElement | undefined;
  private histogramSubscription: Subscription;
  constructor(
    private chartsService: DatasetChartsService,
    store: Store<AppState>,
    private translate: TranslateService,
  ) {
    super(store);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.draw();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSetId'] && this.dataSetId) this.getHistogramData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.histogramSubscription?.unsubscribe();
  }

  public getHistogramData() {
    this.histogramSubscription?.unsubscribe();
    this.histogramSubscription = this.chartsService
      .getHistogramData(this.dataSetId, this.numberOfBins)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: HistogramElement[]) => {
        if (!data) return;

        if (data.length > 0) {
          this.correlationMatrixVisibilityChange.emit(true);
        }

        this.histogramElements = data;
        this.showHistogram = data.length > 0;

        if (data.length > 0) {
          this.selectedElement = data[0];
          this.histogramElements.forEach((element) => {
            element.checked = false;
          });
          this.selectedElement.checked = true;
          this.draw();
          this.histogramLoadingChange.emit(false);
        }
      });
  }

  public selectAndPlot(data: HistogramElement, event: any) {
    if (!event.event) return;
    this.selectedElement = data;
    this.histogramElements.forEach((element) => {
      element.checked = false;
    });
    this.selectedElement.checked = true;
    this.draw();
  }

  protected draw(): void {
    if (!this.selectedElement) return;
    const x: number[] = this.selectedElement.division;
    const y: number[] = this.selectedElement.counts;
    const plotData: number[] = this.prepareHistogramData(x, y);

    setTimeout(() => {
      (window as any).Plotly.newPlot(
        'dataset-histogram',
        [
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          title: this.selectedElement!.attribute_name,
          xaxis: {
            title: this.translate.instant('visualisation.plot_parameters.x_axis_title'),
            tickvals: x, // Set the tick values to be your bin edges
            ticktext: x.map((val) => val.toFixed(2)), // Optionally format the tick labels
            gridcolor: 'rgba(200, 200, 200, 0.2)',
            zerolinecolor: 'rgba(200, 200, 200, 0.5)',
            automargin: true,
            autosize: false,
          },
          ...this.plotParameters,
        },
      );
    }, 100);
  }

  private prepareHistogramData(x: number[], y: number[]): number[] {
    const plotData: number[] = [];
    for (let i = 0; i < y.length; i++) {
      for (let j = 0; j < y[i]; j++) {
        plotData.push((x[i] + x[i + 1]) / 2);
      }
    }
    return plotData;
  }

  protected override handleResize(): void {
    this.draw();
  }
}
