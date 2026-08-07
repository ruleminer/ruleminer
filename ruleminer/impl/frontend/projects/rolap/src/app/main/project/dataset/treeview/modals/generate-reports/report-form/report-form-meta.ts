import { FormGroup } from '@angular/forms';

export enum ReportFormMetaType {
  STR = 'str',
  BOOL = 'bool',
  FLOAT = 'float',
  INT = 'int',
  ENUM = 'enum',
  SECTION = 'section',
}

export interface ReportFormMeta {
  /**
   * Report form specification structure - corresponds to JSON schema from API
   */
  name: string;
  type: ReportFormMetaType;
  isSettings?: boolean;
  default: any;
  ge?: number;
  le?: number;
  required?: boolean;
  nullable?: boolean;
  fixed?: boolean;
  options?: string[];
  properties?: ReportFormMeta[];
}

export interface ChoiceItem {
  name: string;
  value: string;
}

export interface ReportFormData {
  reportFormGroup: FormGroup;
  formMeta: ReportFormMeta[];
}
