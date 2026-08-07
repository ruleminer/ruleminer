import { UnimportantAttributes } from '../../../main/project/dataset/models/dataset-statistics';

export interface V2StatisticsTab {
  id: string; // NgRx entity store id
  unimportantAttributes: UnimportantAttributes;
}
