import { CommonModule } from '@angular/common';
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

const Plotly = (window as any).Plotly;

export interface KaplanMeierEstimator {
  times: number[];
  probabilities: number[];
  events_count?: number[];
  at_risk_count?: number[];
  censored_count?: number[];
}

@Component({
  selector: 'rolap-survival-rule-estimator-curve',
  templateUrl: './survival-rule-estimator-curve.component.html',
  styleUrls: ['./survival-rule-estimator-curve.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class SurvivalRuleEstimatorCurveComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('curvePlotElement') boxPlotElement: ElementRef<HTMLElement>;
  @Input() kaplanMeier: KaplanMeierEstimator;
  @Input() showAxis = false;
  @Input() height = 35;
  @Input() width = 70;
  @Input() staticPlot = true;

  public plotElementId = `rule-survival-curve-plot--${nanoid()}`;
  public viewInitialized: ReplaySubject<boolean> = new ReplaySubject(1);
  private ngUnsubscribe: Subject<void> = new Subject();

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['kaplanMeier']) {
      this.viewInitialized.pipe(takeUntil(this.ngUnsubscribe), take(1)).subscribe(() => {
        this.drawPlot();
      });
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized.next(true);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private drawPlot() {
    const layout = {
      margin: {
        l: this.showAxis ? 30 : 1,
        r: this.showAxis ? 10 : 1,
        b: this.showAxis ? 20 : 1,
        t: 0,
      },
      autosize: true,
      width: this.width,
      height: this.height,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      xaxis: {
        showgrid: true,
        zeroline: true,
        visible: true,
        showline: true,
        tickmode: !this.showAxis ? 'array' : undefined,
        tickvals: !this.showAxis ? [] : undefined,
      },
      yaxis: {
        showgrid: true,
        zeroline: true,
        visible: true,
        showline: true,
        range: [0.0, 1.0],
        tickmode: !this.showAxis ? 'array' : undefined,
        tickvals: !this.showAxis ? [] : undefined,
      },
    };

    const config = {
      staticPlot: this.staticPlot,
      displayModeBar: false,
    };

    const curve = {
      x: this.kaplanMeier.times,
      y: this.kaplanMeier.probabilities,
      line: { shape: 'hv' },
      mode: 'lines',
      type: 'scatter',
    };
    Plotly.newPlot(this.boxPlotElement.nativeElement, [curve], layout, config);
  }
}
