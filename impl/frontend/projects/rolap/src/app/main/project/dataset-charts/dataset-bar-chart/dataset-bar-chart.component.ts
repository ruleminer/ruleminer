import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Subscription, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxRadioGroupModule } from 'devextreme-angular';
import { CardModule } from 'projects/rolap/src/app/common/components/card/card.module';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { BarPlotElement } from '../../models/project';
import { AbstractDatasetChartComponent } from '../abstract-dataset-chart-component';
import { DatasetChartsService } from '../service/dataset-charts.service';

@Component({
  selector: 'rolap-dataset-bar-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, CardModule, DxRadioGroupModule],
  templateUrl: './dataset-bar-chart.component.html',
  styleUrls: ['./dataset-bar-chart.component.scss'],
})
export class DatasetBarChartComponent extends AbstractDatasetChartComponent implements OnInit, OnChanges {
  @ViewChild('histogramNominal', { static: false }) histogramNominal: ElementRef;
  @Input() dataSetId: number;
  @Input() plotParameters: { [key: string]: any };
  @Output() barChartLoadingChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  public barPlotElements: BarPlotElement[] = [];
  public showBarPlot = false;
  public selectedBarPlotElement: BarPlotElement | undefined;
  private chartDataSubscription: Subscription;

  constructor(
    private chartsService: DatasetChartsService,
    store: Store<AppState>,
    private translate: TranslateService,
  ) {
    super(store);
  }

  override ngOnInit() {
    this.translate.onLangChange.subscribe(() => {
      this.draw();
    });
  }

  override ngAfterViewInit(): void {
    this.draw();
  }

  ngOnChanges(change: SimpleChanges): void {
    if (!change['dataSetId'] || !this.dataSetId) return;
    this.getChartData();
  }

  public selectAndPlot(data: BarPlotElement, event: any) {
    if (!event.event) return;
    this.selectedBarPlotElement = data;
    this.barPlotElements.forEach((element) => {
      element.checked = false;
    });
    this.selectedBarPlotElement.checked = true;
    this.draw();
  }

  private getChartData() {
    this.chartDataSubscription?.unsubscribe();
    this.chartDataSubscription = this.chartsService
      .getCountPlot(this.dataSetId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: BarPlotElement[]) => {
        if (!data || data.length === 0) return;

        this.barPlotElements = data;
        this.showBarPlot = true;
        this.selectedBarPlotElement = data[0];

        if (this.selectedBarPlotElement) {
          this.barPlotElements.forEach((element) => {
            element.checked = false;
          });
          this.selectedBarPlotElement.checked = true;
          this.draw();
          this.barChartLoadingChange.emit(false);
        }
      });
  }

  protected override draw(): void {
    setTimeout(() => {
      const chartDiv = this.histogramNominal?.nativeElement;
      if (!this.showBarPlot || !chartDiv) return;

      (window as any).Plotly.newPlot(
        chartDiv,
        [
          {
            x: this.selectedBarPlotElement?.values,
            y: this.selectedBarPlotElement?.counts,
            type: 'bar',
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
          title: this.selectedBarPlotElement?.attribute_name,
          xaxis: {
            title: this.translate.instant('visualisation.plot_parameters.x_axis_title'),
            gridcolor: 'rgba(200, 200, 200, 0.2)',
            zerolinecolor: 'rgba(200, 200, 200, 0.5)',
            autosize: false,
            automargin: true,
          },
          ...this.plotParameters,
        },
      );
    }, 100);
  }
}
