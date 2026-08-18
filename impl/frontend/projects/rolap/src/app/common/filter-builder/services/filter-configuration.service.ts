import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterField, OperatorDefinition, FilterDataType } from '../filter-builder.types';

export const DX_OPERATOR_MAP: { [key: string]: string } = {
  '=': 'equals',
  '<>': 'notEquals',
  '<': 'lessThan',
  '>': 'greaterThan',
  '<=': 'lessThanOrEqual',
  '>=': 'greaterThanOrEqual',
  'isblank': 'isNull',
  'isnotblank': 'isNotNull',
  'between': 'between',
};

export const INTERNAL_OPERATOR_MAP: { [key: string]: string } = Object.entries(DX_OPERATOR_MAP)
  .reduce((acc, [key, value]) => { acc[value] = key; return acc; }, {} as { [key: string]: string });


@Injectable({
  providedIn: 'root'
})
export class FilterConfigurationService {

  constructor(private translate: TranslateService) { }

  private allOperators: OperatorDefinition[] = [
    { value: 'equals', text: 'filter_builder.operators.equals', dxValue: '=', appliesTo: [FilterDataType.Text, FilterDataType.Numeric, FilterDataType.Numeric, FilterDataType.Boolean, FilterDataType.List], requiresValue: true },
    { value: 'notEquals', text: 'filter_builder.operators.notEquals', dxValue: '<>', appliesTo: [FilterDataType.Text, FilterDataType.Numeric, FilterDataType.Numeric, FilterDataType.Boolean, FilterDataType.List], requiresValue: true },
    { value: 'isNull', text: 'filter_builder.operators.isNull', dxValue: 'isblank', appliesTo: [FilterDataType.Text, FilterDataType.Numeric, FilterDataType.Numeric, FilterDataType.Boolean, FilterDataType.List], requiresValue: false },
    { value: 'isNotNull', text: 'filter_builder.operators.isNotNull', dxValue: 'isnotblank', appliesTo: [FilterDataType.Text, FilterDataType.Numeric, FilterDataType.Numeric, FilterDataType.Boolean, FilterDataType.List], requiresValue: false },
    { value: 'greaterThan', text: 'filter_builder.operators.greaterThan', dxValue: '>', appliesTo: [FilterDataType.Numeric, FilterDataType.Numeric], requiresValue: true },
    { value: 'lessThan', text: 'filter_builder.operators.lessThan', dxValue: '<', appliesTo: [FilterDataType.Numeric, FilterDataType.Numeric], requiresValue: true },
    { value: 'greaterThanOrEqual', text: 'filter_builder.operators.greaterThanOrEqual', dxValue: '>=', appliesTo: [FilterDataType.Numeric, FilterDataType.Numeric], requiresValue: true },
    { value: 'lessThanOrEqual', text: 'filter_builder.operators.lessThanOrEqual', dxValue: '<=', appliesTo: [FilterDataType.Numeric, FilterDataType.Numeric], requiresValue: true },
    { value: 'between', text: 'filter_builder.operators.between', dxValue: 'between', appliesTo: [FilterDataType.Numeric, FilterDataType.Numeric], requiresValue: true },
    { value: 'isTrue', text: 'filter_builder.operators.isTrue', dxValue: '=', appliesTo: [FilterDataType.Boolean], requiresValue: true },
    { value: 'isFalse', text: 'filter_builder.operators.isFalse', dxValue: '=', appliesTo: [FilterDataType.Boolean], requiresValue: true },
    { value: 'equalsAttr', text: 'filter_builder.operators.equalsAttr', dxValue: '=', appliesTo: [FilterDataType.Text], requiresValue: true },
    { value: 'notEqualsAttr', text: 'filter_builder.operators.notEqualsAttr', dxValue: '<>', appliesTo: [FilterDataType.Text], requiresValue: true },
    { value: 'isNullAttr', text: 'filter_builder.operators.isNullAttr', dxValue: 'isblank', appliesTo: [FilterDataType.Text], requiresValue: false },
    { value: 'isNotNullAttr', text: 'filter_builder.operators.isNotNullAttr', dxValue: 'isnotblank', appliesTo: [FilterDataType.Text], requiresValue: false },
    { value: 'greaterThanAttr', text: 'filter_builder.operators.greaterThanAttr', dxValue: '>', appliesTo: [FilterDataType.Text], requiresValue: true },
    { value: 'lessThanAttr', text: 'filter_builder.operators.lessThanAttr', dxValue: '<', appliesTo: [FilterDataType.Text], requiresValue: true },
    { value: 'greaterThanOrEqualAttr', text: 'filter_builder.operators.greaterThanOrEqualAttr', dxValue: '>=', appliesTo: [FilterDataType.Text], requiresValue: true },
    { value: 'lessThanOrEqualAttr', text: 'filter_builder.operators.lessThanOrEqualAttr', dxValue: '<=', appliesTo: [FilterDataType.Text], requiresValue: true },
    { value: 'isTrueAttr', text: 'filter_builder.operators.isTrueAttr', dxValue: '=', appliesTo: [FilterDataType.Text], requiresValue: true },
    { value: 'isFalseAttr', text: 'filter_builder.operators.isFalseAttr', dxValue: '=', appliesTo: [FilterDataType.Text], requiresValue: true },

  ];

  public static readonly normalOperators: string[] = [
    'equals',
    'notEquals',
    'isNull',
    'isNotNull',
    'greaterThan',
    'lessThan',
    'greaterThanOrEqual',
    'lessThanOrEqual',
    'between',
    'isTrue',
    'isFalse',
  ];

  public static readonly attrOperators: string[] = [
    'equalsAttr',
    'notEqualsAttr',
    'isNullAttr',
    'isNotNullAttr',
    'greaterThanAttr',
    'lessThanAttr',
    'greaterThanOrEqualAttr',
    'lessThanOrEqualAttr',
    'betweenAttr',
    'isTrueAttr',
    'isFalseAttr',
  ];

  public getOperatorsForField(field: FilterField): OperatorDefinition[] {
    const normalizedDataType = field.dataType;

    let operators = this.allOperators;

    if (field.filterOperations && field.filterOperations.length > 0) {
      operators = field.filterOperations
        .map((dxOp: string) => this.allOperators.find(opDef => opDef && (opDef.dxValue === dxOp || opDef.value === dxOp)))
        .filter((opDef): opDef is OperatorDefinition => opDef !== undefined);
    } else {
      operators = this.allOperators.filter(op => op.appliesTo.includes(normalizedDataType));
    }

    return operators.map(op => ({
      ...op,
      text: this.translate.instant(op.text)
    }));
  }

  getOperator(internalValue: string): OperatorDefinition | undefined {
    const operator = this.allOperators.find(op => op.value === internalValue);
    if (!operator) {
      return undefined;
    }
    return {
      ...operator,
      text: this.translate.instant(operator.text)
    };
  }


  getEffectiveDataType(field: FilterField): FilterDataType {
    if (field.lookup && field.lookup.dataSource?.length > 0) return FilterDataType.List;
    return field.dataType;
  }

}
