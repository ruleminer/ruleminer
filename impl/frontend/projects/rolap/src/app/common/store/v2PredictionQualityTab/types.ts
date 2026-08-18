export interface V2PredictionQualityTab {
  id: string; // NgRx entity store id
  histogram: PredictionHistogram;
  crossValidation: { numOfFolds: number | null; table: any[] } | null;
  generalIndicators: any;
}

export interface PredictionHistogram {
  bin_edges: number[];
  histogram: number[];
  min: number;
  max: number;
}
