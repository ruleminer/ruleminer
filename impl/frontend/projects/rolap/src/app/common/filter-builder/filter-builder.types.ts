import { Type } from '@angular/core';
import { FormControl, FormGroup, FormArray, AbstractControl } from '@angular/forms';

export enum FilterDataType {
  Text = 'text',
  Boolean = 'boolean',
  List = 'list',
  Numeric = 'numeric'
}

export enum FilterCondition {
  AND = 'AND',
  OR = 'OR'
}

export enum FilterOperator {
  Equals = 'equals',
  NotEquals = 'notEquals',
  IsNull = 'isNull',
  IsNotNull = 'isNotNull',
  GreaterThan = 'greaterThan',
  LessThan = 'lessThan',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThanOrEqual = 'lessThanOrEqual',
  Between = 'between',
  IsTrue = 'isTrue',
  IsFalse = 'isFalse',
  EqualsAttr = 'equalsAttr',
  NotEqualsAttr = 'notEqualsAttr',
  IsNullAttr = 'isNullAttr',
  IsNotNullAttr = 'isNotNullAttr',
  GreaterThanAttr = 'greaterThanAttr',
  LessThanAttr = 'lessThanAttr',
  GreaterThanOrEqualAttr = 'greaterThanOrEqualAttr',
  LessThanOrEqualAttr = 'lessThanOrEqualAttr',
  BetweenAttr = 'betweenAttr',
  IsTrueAttr = 'isTrueAttr',
  IsFalseAttr = 'isFalseAttr'
}


export enum FilterNodeType {
  Condition = 'condition',
  Group = 'group'
}


export interface FilterField {
  dataField: string;
  caption?: string;
  dataType: FilterDataType;
  lookup?: {
    dataSource: any[];
    attrDataSource: any[];
  };
  filterOperations?: string[];
  customValueEditor?: Type<any>;
}


export interface OperatorDefinition {
  value: string;
  text: string;
  dxValue: string;
  appliesTo: FilterDataType[];
  requiresValue: boolean;
}


export interface ConditionFormValue {
  field: FormControl<string | null>;
  operator: FormControl<string | null>;
  value: FormControl<any | null>;
  dataType?: FormControl<FilterDataType | null | undefined>;
  valueEnd?: FormControl<any | null>;
}

export type ConditionFormGroup = FormGroup<ConditionFormValue>;

export interface GroupFormValue {
  condition: FormControl<FilterCondition>;
  rules: FormArray<AbstractControl>;
}


export type GroupFormGroup = FormGroup<GroupFormValue>;
