import { DatasetAttribute } from '../../dataset/models/dataset';

export interface DatasetAttributesInfo {
  attrs: DatasetAttribute[];
  classes: DatasetAttribute | null;
  survivalTime: DatasetAttribute | null;
  survivalTimeIndex: number | null;
}
