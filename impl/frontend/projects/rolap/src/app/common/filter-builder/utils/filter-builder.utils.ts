import { FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { FilterDataType, FilterOperator } from '../filter-builder.types';


export function updateFilterValueValidation(
  valueControl: FormControl | null | undefined,
  valueEndControl: FormControl | null | undefined,
  isValueRequired: boolean,
  isBetweenOperator: boolean,
  effectiveDataType: FilterDataType | undefined,
  operatorValue?: string | undefined
): void {

  if (!valueControl) {
    console.error("updateFilterValueValidation: valueControl is missing.");
    return;
  }

  const isAttrOp = isAttrOperatorFn(operatorValue);
  
  const createValidators = (): ValidatorFn[] => {
    const validators: ValidatorFn[] = [Validators.required];
    
    // For numeric fields, add pattern validation
    if (effectiveDataType === FilterDataType.Numeric) {
      // For attribute operators, only validate as numeric if the current value is actually a number
      if (isAttrOp) {
        // Custom validator that checks if it's a string (attribute name) or valid number
        validators.push((control: AbstractControl) => {
          const value = control.value;
          if (value === null || value === undefined || value === '') {
            return null; // Let required validator handle empty values
          }
          
          // If it's a string that doesn't look like a number, assume it's an attribute name (valid)
          if (typeof value === 'string' && isNaN(Number(value))) {
            return null; // Valid attribute name
          }
          
          // If it looks like a number, validate it as a number
          const numericPattern = /^-?\d*\.?\d+$/;
          return numericPattern.test(String(value)) ? null : { pattern: true };
        });
      } else {
        // For non-attribute operators, always validate as numeric
        validators.push(Validators.pattern(/^-?\d*\.?\d+$/));
      }
    }
    
    return validators;
  };

  if (isValueRequired) {
    
    valueControl.enable({ emitEvent: false });
    valueEndControl?.enable({ emitEvent: false });

    valueControl.setValidators(createValidators());

    if (isBetweenOperator) {
      valueEndControl?.setValidators(createValidators());
    } else {
      valueEndControl?.clearValidators();
    }

  } else {
    
    valueControl.disable({ emitEvent: false });
    valueEndControl?.disable({ emitEvent: false });

    
    valueControl.setValue(null, { emitEvent: false });
    valueEndControl?.setValue(null, { emitEvent: false });

    valueControl.clearValidators();
    valueEndControl?.clearValidators();
  }

  
  valueControl.updateValueAndValidity({ emitEvent: false });
  valueEndControl?.updateValueAndValidity({ emitEvent: false });
}

export function isAttrOperatorFn(operatorValue: string | undefined): boolean {
    const attrOperators = [
    FilterOperator.EqualsAttr,
    FilterOperator.NotEqualsAttr,
    FilterOperator.IsNullAttr,
    FilterOperator.IsNotNullAttr,
    FilterOperator.GreaterThanAttr,
    FilterOperator.LessThanAttr,
    FilterOperator.GreaterThanOrEqualAttr,
    FilterOperator.LessThanOrEqualAttr,
    FilterOperator.BetweenAttr,
    FilterOperator.IsTrueAttr,
    FilterOperator.IsFalseAttr
    ];
    return attrOperators.includes(operatorValue as FilterOperator);
  }