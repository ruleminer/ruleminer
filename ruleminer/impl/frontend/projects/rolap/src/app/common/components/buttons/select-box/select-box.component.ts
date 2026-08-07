import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import {
  ControlContainer,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { DxSelectBoxModule } from 'devextreme-angular';

import { FormGroupTitleComponent } from '../form-group-title/form-group-title.component';
import { FormGroupTitleConfig } from '../form-group-title/types';
import { SelectBoxItem } from './types';

@Component({
  selector: 'rolap-select-box',
  standalone: true,
  templateUrl: './select-box.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectBoxComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, ReactiveFormsModule, DxSelectBoxModule, TranslateModule, FormGroupTitleComponent],
})
export class SelectBoxComponent implements ControlValueAccessor, OnChanges {
  @Input() formControlName: string = '';
  @Input() items: SelectBoxItem[] = [];
  @Input() titleConfig: FormGroupTitleConfig | null = null;

  public form: FormGroup;
  public control: FormControl;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private controlContainer: ControlContainer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formControlName'] && this.formControlName) {
      this.form = this.controlContainer.control as FormGroup;
      this.control = this.form.get(this.formControlName) as FormControl;
    }
  }

  writeValue(value: any): void {
    this.control?.setValue(value);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.control) {
      isDisabled ? this.control.disable() : this.control.enable();
    }
  }
}
