import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Subject, combineLatest, map, mergeMap, shareReplay, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { selectCurrentV2RulesTable } from '../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { DatasetChartsService } from '../../dataset-charts/service/dataset-charts.service';
import { NewRow, RegressionMeta } from '../../models/ruleset';
import { LabelHistogramData } from './models/label-histogram.model';
import { RegressionRuleHistogramService } from './service/regression-rule-histogram.service';

const Plotly = (window as any).Plotly;

@Component({
  selector: 'rolap-regression-rule-histogram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './regression-rule-histogram.component.html',
  styleUrls: ['./regression-rule-histogram.component.scss'],
})
export class RegressionRuleHistogramComponent implements OnInit, OnDestroy {
  private readonly DEFAULT_BINS = 20;
  @ViewChild('histogramElement') histogramElement: ElementRef<HTMLElement>;
  @Input() datasetId: number;
  @Input() ruleUuids: Set<string>;
  public rules: Map<string, NewRow>;
  public data: LabelHistogramData;
  private decisionAttribute: string;
  private ngUnsubscribe: Subject<void> = new Subject();
  public innerWidth: number;

  constructor(
    private translate: TranslateService,
    private store: Store<AppState>,
    private histogramService: RegressionRuleHistogramService,
    private chartsService: DatasetChartsService,
  ) {
    this.innerWidth = window.innerWidth;
  }

  ngOnInit(): void {
    const $histogramData = this.store.select(selectCurrentV2RulesTable).pipe(
      filterOutNullish(),
      take(1),
      mergeMap((res) => {
        const meta = res.meta as RegressionMeta;
        this.decisionAttribute = meta.decision_attribute;
        this.rules = new Map();
        (res.data.filter((row: any) => this.ruleUuids.has(row.uuid)) as NewRow[]).forEach((row) => {
          this.rules.set(row.uuid, row);
        });
        const $rulesHistogram = this.histogramService.getHistogramData(
          this.datasetId,
          Array.from(this.ruleUuids),
          this.DEFAULT_BINS,
        );
        const $labelHistogram = this.chartsService
          .getHistogramData(this.datasetId, this.DEFAULT_BINS, [this.decisionAttribute])
          .pipe(map((data) => data[0]));

        return combineLatest([$rulesHistogram, $labelHistogram]);
      }),
      shareReplay(1),
      takeUntil(this.ngUnsubscribe),
    );
    $histogramData.pipe(take(1)).subscribe(([rulesHistograms, labelHistogram]) => {
      this.data = {
        ...rulesHistograms,
        originalLabelHistogram: labelHistogram.counts,
      };
      this.drawHistogram();
    });
    this.translate.onLangChange
      .pipe(
        mergeMap(() => $histogramData),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => {
        this.drawHistogram();
      });

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.innerWidth = window.innerWidth;
    this.drawHistogram();
  }

  private drawHistogram() {
    const data: any[] = [];
    const xbins = {
      start: this.data.bin_edges[0],
      end: this.data.bin_edges[this.data.bin_edges.length - 1],
      size: this.data.bin_edges[1] - this.data.bin_edges[0],
    };

    const screenWidth = this.innerWidth;

    Object.keys(this.data.histograms).forEach((ruleUuid: string) => {
      const x = this.data.bin_edges;
      const y = this.data.histograms[ruleUuid];
      const plotData: number[] = [];
      for (let i = 0; i < y.length; i++) {
        for (let j = 0; j < y[i]; j++) {
          plotData.push((x[i] + x[i + 1]) / 2);
        }
      }
      const rule: NewRow = this.rules.get(ruleUuid)!;
      let ruleString = `r${rule.autoIncrement}: ${rule.string}`;
      ruleString = this.getBreakpointText(ruleString, screenWidth);

      data.push({
        x: plotData,
        type: 'histogram',
        autobinx: false,
        name: ruleString,
        xbins: xbins,
        checked: false,
        opacity: 0.6,
      });
    });

    let labelString = this.translate.instant('project.rules.rule_histogram.y_axis_label', {
      decisionAttributeName: this.decisionAttribute,
    });
    labelString = this.getBreakpointText(labelString, screenWidth);

    data.push({
      ...data[0],
      x: this.data.originalLabelHistogram,
      name: labelString,
    });

    const layout = {
      responsive: true,
      barmode: 'overlay',
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        yref: 'container',
      },
      yaxis: {
        title: this.translate.instant('project.rules.rule_histogram.y_axis_label', {
          decisionAttributeName: this.decisionAttribute,
        }),
      },
      xaxis: {
        automargin: true,
        range: [this.data.bin_edges[0], this.data.bin_edges[-1]],
        tickvals: this.data.bin_edges, // Set the tick values to be your bin edges
        ticktext: this.data.bin_edges.map((val) => val.toFixed(2)), // Optionally format the tick labels
        gridcolor: 'rgba(200, 200, 200, 0.2)',
        zerolinecolor: 'rgba(200, 200, 200, 0.5)',
      },
    };

    Plotly.newPlot(this.histogramElement.nativeElement, data, layout);
  }

  private handleResize(): void {
    this.drawHistogram();
  }

  /**
   * Breaks the input text into multiple lines to fit within the specified width.
   * It adds <br> tags at appropriate positions to ensure the text wraps.
   * The function avoids adding <br> tags if there is no text after the break point.
   *
   * @param text - The input text to be wrapped.
   * @param width - The width of the container to determine where to wrap the text.
   * @returns The text with <br> tags inserted at appropriate positions.
   */
  private getBreakpointText(text: string, width: number): string {
    const breakpoint = Math.floor(width / 10);
    return text.replace(
      new RegExp(`(.{1,${breakpoint}})(\\s|$)`, 'g'),
      (match, p1) => p1.trim() + (p1.trim().length < text.length ? '<br>' : ''),
    );
  }
}
