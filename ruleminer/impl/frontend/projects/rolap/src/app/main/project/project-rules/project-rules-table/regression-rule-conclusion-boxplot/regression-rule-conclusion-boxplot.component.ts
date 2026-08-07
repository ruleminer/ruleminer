import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { ReplaySubject, Subject, take, takeUntil } from 'rxjs';

import { nanoid } from 'nanoid';

import { RegressionConclusionValue } from '../project-rules-table-editor/rules-editor-side-column/rule-conclusion-editor/regression/models/conclusion';

const Plotly = (window as any).Plotly;

interface BoxPlotData {
  value: number;
  min: number;
  max: number;
  lower: number;
  upper: number;
  std: number;
  mean: number;
}

@Component({
  selector: 'rolap-regression-rule-conclusion-boxplot',
  templateUrl: './regression-rule-conclusion-boxplot.component.html',
  styleUrls: ['./regression-rule-conclusion-boxplot.component.scss'],
})
export class RegressionRuleConclusionBoxplotComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('boxPlotElement') boxPlotElement: ElementRef<HTMLElement>;
  @Input() showAxis: boolean = false;
  @Input() height: number = 30;
  @Input() width: number = 70;
  @Input() conclusion: RegressionConclusionValue;
  @Input() labelMinMaxValues: { min: number; max: number };
  public readonly NUMBER_FORMAT: string = '1.1-3'; // at least 1 digit after the decimal point maximum 3
  public data: BoxPlotData;
  public xData: number[];
  public boxPlotElementId: string = `rule-box-plot--${nanoid()}`;

  public viewInitialized: ReplaySubject<boolean> = new ReplaySubject(1);
  private ngUnsubscribe: Subject<void> = new Subject();

  ngAfterViewInit(): void {
    this.viewInitialized.next(true);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['conclusion'] || changes['labelMinMaxValues']) {
      if (!!this.conclusion) {
        this.data = {
          min: this.conclusion.train_covered_y_min as number,
          max: this.conclusion.train_covered_y_max as number,
          value: this.conclusion.value,
          lower: this.conclusion.low as number,
          upper: this.conclusion.high as number,
          std: this.conclusion.train_covered_y_std as number,
          mean: this.conclusion.train_covered_y_mean as number,
        };
      }
    }
    if (!!this.labelMinMaxValues && !!this.conclusion) {
      this.viewInitialized.pipe(takeUntil(this.ngUnsubscribe), take(1)).subscribe(() => {
        this.drawPlot();
      });
    }
  }

  private drawPlot() {
    this.xData = [
      this.data.min,
      this.data.lower,
      this.data.lower,
      this.data.value,
      this.data.upper,
      this.data.upper,
      this.data.max,
    ];
    const margin = {
      l: this.showAxis ? 10 : 0,
      r: this.showAxis ? 10 : 0,
      b: this.showAxis ? 40 : 0,
      t: 0,
    };

    const layout = {
      margin: margin,
      autosize: true,
      width: this.width,
      height: this.height + margin.b,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      xaxis: {
        range: [this.labelMinMaxValues.min, this.labelMinMaxValues.max],
        showgrid: this.showAxis,
        zeroline: this.showAxis,
        visible: this.showAxis,
        showline: this.showAxis,
        nticks: this.showAxis ? 10 : 0,
      },
      yaxis: {
        showgrid: false,
        zeroline: false,
        visible: false,
      },
    };

    const config = {
      staticPlot: true,
      displayModeBar: false,
    };

    const box = {
      x: this.xData,
      type: 'box',
    };
    Plotly.newPlot(this.boxPlotElement.nativeElement, [box], layout, config);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
