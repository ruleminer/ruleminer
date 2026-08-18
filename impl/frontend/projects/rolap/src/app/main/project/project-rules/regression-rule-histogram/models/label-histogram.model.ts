export interface LabelHistogramData {
  bin_edges: number[];
  histograms: { [ruleUuid: string]: number[] };
  originalLabelHistogram: number[];
  max: number;
  min: number;
}
