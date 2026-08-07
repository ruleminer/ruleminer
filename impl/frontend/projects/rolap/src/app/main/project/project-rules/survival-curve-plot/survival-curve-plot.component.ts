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

import { ReplaySubject, Subject, combineLatest, take, takeUntil } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

const Plotly = (window as any).Plotly;

/**
 * Generic survival plot component
 *
 * @export
 * @class SurvivalCurvePlotComponent
 */
@Component({
  selector: 'rolap-survival-curve-plot',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './survival-curve-plot.component.html',
  styleUrls: ['./survival-curve-plot.component.scss'],
})
export class SurvivalCurvePlotComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('plotElement') plotElement: ElementRef<HTMLElement>;
  @Input() estimators: Map<string, { times: number[]; probabilities: number[] }>;
  @Input() noMargin = false;
  @Input() height: number | undefined = undefined;
  public viewInitialized: ReplaySubject<boolean> = new ReplaySubject(1);
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private translate: TranslateService) {
    // on language change redraw the plot to apply translated labels
    combineLatest([this.viewInitialized, this.translate.onLangChange])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.drawPlot();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estimators']) {
      this.viewInitialized.pipe(takeUntil(this.ngUnsubscribe), take(1)).subscribe(() => {
        this.drawPlot();
      });
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized.next(true);
  }

  private drawPlot() {
    const data: any[] = [];
    [...this.estimators.keys()]
      .sort()
      .reverse()
      .forEach((name: string, i: number) => {
        const estimator = this.estimators.get(name);
        if (!estimator) return;
        data.push({
          x: estimator.times,
          y: estimator.probabilities,
          line: { shape: 'hv' },
          mode: 'lines',
          type: 'scatter',
          name: this.translate.instant(name),
        });
      });

    const layout = {
      margin: this.noMargin ? { l: 45, r: 0, b: 0, t: 0 } : undefined,
      height: this.height,
      autosize: true,
      responsive: true,
      legend: {
        orientation: 'h',
        yanchor: 'top',
        y: -0.45,
        xanchor: 'center',
        x: 0.5,
      },
      yaxis: {
        title: this.translate.instant('project.rules.rule_survival_curve_plot.y_axis_label'),
      },
      xaxis: {
        title: this.translate.instant('project.rules.rule_survival_curve_plot.x_axis_label'),
      },
    };
    Plotly.newPlot(this.plotElement.nativeElement, data, layout);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
