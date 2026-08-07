import { DatasetAttribute } from '../../../main/project/dataset/models/dataset';
import { v2AttributeMinMaxValues } from '../v2RulesTable/types';

export type V2Attributes = {
  id: string; //ngrx store id
  data: DatasetAttribute[];
  minMaxValues: v2AttributeMinMaxValues;
};
