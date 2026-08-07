import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** separator must be different form decimal */
export const fileFormatValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const separator = control.get('separator');
  const decimal = control.get('decimal');

  return separator && decimal && separator.value === decimal.value ? { seperatorEqualsDecimal: true } : null;
};
