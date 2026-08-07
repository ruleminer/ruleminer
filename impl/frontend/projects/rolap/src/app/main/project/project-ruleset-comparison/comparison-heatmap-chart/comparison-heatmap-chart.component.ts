import { Component, Input, OnChanges } from '@angular/core';

import { HeatmapData, PlotyHeatmapHelper } from '../../../../common/modules/visualisation/helpers/ploty-heatmap-helper';
import { V2ComparisonForm } from '../../../../common/store/v2Comparison/types';
import { RuleSimilarity } from '../../models/ruleset';
import { PreparedRule } from '../types';
import { ComparisonChartData } from './types';

@Component({
  selector: 'rolap-comparison-heatmap-chart',
  templateUrl: './comparison-heatmap-chart.component.html',
  styleUrls: ['./comparison-heatmap-chart.component.scss'],
})
export class ComparisonHeatmapChartComponent implements OnChanges {
  @Input() chartData: ComparisonChartData | null;

  ngOnChanges(): void {
    if (!this.chartData) return;
    this.handleSimilarityResult(
      this.chartData.ruleSimilarity,
      this.chartData.rulesetOne,
      this.chartData.rulesetTwo,
      this.chartData.relationType,
    );
  }

  private handleSimilarityResult(
    ruleSimilarity: RuleSimilarity,
    rulesetOne: PreparedRule[],
    rulesetTwo: PreparedRule[],
    relationType: V2ComparisonForm['relationType'],
  ): void {
    if (relationType) return;
    this.drawHeatmap(ruleSimilarity, rulesetOne, rulesetTwo);
  }

  private convertToPlotlyHeatmapData(
    data: RuleSimilarity,
    rulesetOne: PreparedRule[],
    rulesetTwo: PreparedRule[],
  ): HeatmapData | null {
    if (!this.chartData) return null;
    const xValues = Object.keys(data);
    const yValues = Object.keys(data[xValues[0]]);
    const zValues = yValues.map((y) => xValues.map((x) => data[x][y]));

    const firstRulesetMap = new Map<string, string>(rulesetOne.map((rule) => [rule.uuid, rule.string]));
    const secondRulesetMap = new Map<string, string>(rulesetTwo.map((rule) => [rule.uuid, rule.string]));

    const labelX = xValues.map((ruleUuid: string) => {
      const ruleIndex = rulesetOne.findIndex((r) => r.uuid === ruleUuid);
      return `Rule ${rulesetOne[ruleIndex].autoIncrement}`;
    });
    const labelY = yValues.map((ruleUuid: string) => {
      const ruleIndex = rulesetTwo.findIndex((r) => r.uuid === ruleUuid);
      return `Rule ${rulesetTwo[ruleIndex].autoIncrement}`;
    });

    const heatmapData = {
      titleY: this.chartData.secondRulesetName,
      titleX: this.chartData.firstRulesetName,
      labelX: labelX,
      labelY: labelY,
      x: xValues.map((ruleUuid: string) => firstRulesetMap.get(ruleUuid) as string),
      y: yValues.map((ruleUuid: string) => secondRulesetMap.get(ruleUuid) as string),
      z: zValues,
      type: 'heatmap',
      hoverongaps: false,
    };

    return heatmapData;
  }

  private drawHeatmap(data: RuleSimilarity, rulesetOne: PreparedRule[], rulesetTwo: PreparedRule[]): void {
    const plotData = this.convertToPlotlyHeatmapData(data, rulesetOne, rulesetTwo);
    if (!plotData) return;

    PlotyHeatmapHelper.drawHeatmap(plotData, 'heatmap-chart');
  }
}
