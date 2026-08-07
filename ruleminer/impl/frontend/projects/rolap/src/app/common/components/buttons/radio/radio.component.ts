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
import { DxRadioGroupModule } from 'devextreme-angular';

import { TooltipComponent } from '../../tooltip/tooltip.component';
import { FormGroupTitleComponent } from '../form-group-title/form-group-title.component';
import { FormGroupTitleConfig } from '../form-group-title/types';
import { RadioItem } from './types';

@Component({
  standalone: true,
  selector: 'rolap-radio',
  templateUrl: './radio.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true,
    },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxRadioGroupModule,
    TranslateModule,
    TooltipComponent,
    FormGroupTitleComponent,
  ],
})
export class RadioComponent implements ControlValueAccessor, OnChanges {
  @Input() titleConfig: FormGroupTitleConfig | null = null;
  @Input() items: RadioItem[] = [];
  @Input() formControlName: string = '';

  public form: FormGroup;
  public control: FormControl;

  private onChange: (value: any) => void;
  private onTouched: () => void;

  constructor(private controlContainer: ControlContainer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formControlName']) {
      this.form = this.controlContainer.control as FormGroup;
      this.control = this.form.get(this.formControlName) as FormControl;
    }
  }

  writeValue(value: any): void {
    if (!this.control) return;
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (!this.control) return;
    isDisabled ? this.control.disable() : this.control.enable();
  }
}
