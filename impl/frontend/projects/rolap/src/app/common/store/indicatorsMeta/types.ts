import { Description } from '../../components/tooltip/tooltip.component';

export type IndicatorKey = string;

export type IndicatorMeta = {
  key: IndicatorKey;
  description_en: string;
  description_pl: string;
  higher_is_better: boolean;
};

export type IndicatorsMetaState = {
  indicatorsHigherIsBetterFlags: Record<IndicatorKey, boolean>;
  indicatorsDescriptions: Record<IndicatorKey, Description>;
};
