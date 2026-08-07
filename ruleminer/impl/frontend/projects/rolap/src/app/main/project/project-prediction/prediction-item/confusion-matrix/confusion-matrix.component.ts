/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

const Plotly = (window as any).Plotly;

@Component({
  selector: 'rolap-confusion-matrix',
  templateUrl: './confusion-matrix.component.html',
  styleUrls: ['./confusion-matrix.component.scss'],
})
export class ConfusionMatrixComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('confusionMatrixElement', { static: true }) confusionMatrixElement: ElementRef<HTMLElement>;
  @Input() data: any;
  @Input() show: boolean;
  @Input() isTest = false;
  private resizeListener: () => void;
  private ngUnsubscribe = new Subject<void>();
  private colorScaleValue = [
    ['0.0', 'rgb(232,241,250)'],
    ['0.1', 'rgb(210,227,243)'],
    ['0.2', 'rgb(178,210,232)'],
    ['0.3', 'rgb(130,187,219)'],
    ['0.4', 'rgb(92,164,208)'],
    ['0.5', 'rgb(54,134,192)'],
    ['0.6', 'rgb(26,104,174)'],
    ['0.7', 'rgb(8,73,144)'],
    ['0.8', 'rgb(8,54,116)'],
    ['0.9', 'rgb(8,54,116)'],
    ['1.0', 'rgb(8,54,116)'],
  ];

  constructor(private changeDetector: ChangeDetectorRef, private translateService: TranslateService) {}

  ngOnChanges(): void {
    this.draw();
  }

  ngOnInit() {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => this.draw());
    this.resizeListener = () => this.draw();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    window.removeEventListener('resize', this.resizeListener);
  }

  private draw(): void {
    if (!this.data) return;
    const { x, y, normalizedZ, realZValues } = this.generateConfusionMatrix(this.data) || {};
    if (!x || !y || !normalizedZ || !realZValues) return;

    const trimLabels = (labels: string[], maxLength: number) =>
      labels.map((label) => (label.length > maxLength ? label.slice(0, maxLength - 1) + '…' : label));

    const xTrimmedLabels = trimLabels(x, 10);
    const yTrimmedLabels = trimLabels(y, 10);

    const trueClassLabel = this.translateService.instant('project.prediction.true_class_label');
    const predictedClassLabel = this.translateService.instant('project.prediction.predicted_class_label');
    const elementCountLabel = this.translateService.instant('project.prediction.element_count_label');

    Plotly.newPlot(
      this.confusionMatrixElement.nativeElement,
      [
        {
          x: xTrimmedLabels,
          y: yTrimmedLabels,
          z: normalizedZ,
          type: 'heatmap',
          colorscale: this.colorScaleValue,
          showscale: false,
          text: realZValues.map((row) => row.map((val) => val.toString())),
          texttemplate: '%{text}',
          hovertemplate:
            `${trueClassLabel} %{y}<br>` +
            `${predictedClassLabel} %{x}<br>` +
            `${elementCountLabel} %{text}` +
            '<extra></extra>',
          textfont: {
            family: 'Arial',
            size: 12,
            color: normalizedZ.map((row) => row.map((val) => (val >= 0.5 ? 'white' : 'black'))),
          },
        },
      ],
      {
        title: this.translateService.instant('project.prediction.confusion_matrix'),
        responsive: true,
        xaxis: {
          type: 'category',
          title: { text: this.translateService.instant('project.prediction.matrix.x_axis'), standoff: 40 },
        },
        yaxis: {
          type: 'category',
          autorange: 'reversed',
          title: { text: this.translateService.instant('project.prediction.matrix.y_axis'), standoff: 30 },
        },
        margin: { l: 160, r: 100, b: 100, t: 100, pad: 4 },
      },
    );

    this.changeDetector.detectChanges();
  }

  private generateConfusionMatrix(data: any) {
    if (!Array.isArray(data)) return;
    const labels = Array.from(new Set(data.flatMap(Object.keys))).map((label) => label);
    const z = data.map((item) => labels.map((label) => item[label] || 0));
    const normalizedZ = z.map((row) => this.normalize([...row]));
    const matrix = { x: labels, y: labels, normalizedZ: normalizedZ, realZValues: z };
    return matrix;
  }

  private normalize(list: number[]): number[] {
    const minMax = list.reduce(
      (acc, value) => {
        if (value < acc.min) {
          acc.min = value;
        }
        if (value > acc.max) {
          acc.max = value;
        }
        return acc;
      },
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    );

    return list.map((value) => {
      if (minMax.max === minMax.min) {
        return 1 / list.length;
      }
      const diff = minMax.max - minMax.min;
      return (value - minMax.min) / diff;
    });
  }
}
