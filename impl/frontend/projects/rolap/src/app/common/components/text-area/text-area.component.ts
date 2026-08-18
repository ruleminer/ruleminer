import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, forwardRef, inject } from '@angular/core';
import {
  ControlContainer,
  ControlValueAccessor,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'rolap-text-area',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextAreaComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="dx-field">
      <div *ngIf="label" class="dx-field-label">{{ label | translate }}</div>
      <textarea
        [id]="formControlName"
        [placeholder]="placeholder"
        [style.height]="height"
        [style.width]="width"
        [style.max-height]="maxHeight"
        [style.min-height]="minHeight"
        [value]="value"
        [disabled]="isDisabled"
        (input)="handleInput($event)"
        (blur)="onTouched()"></textarea>
    </div>
  `,
  styleUrls: ['./text-area.component.scss'],
})
export class TextAreaComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() formControlName: string = '';
  @Input() height?: number;
  @Input() width?: number;
  @Input() maxHeight?: string;
  @Input() minHeight?: string;
  @Input() maxLength?: string;
  @Input() label?: string;

  private controlContainer = inject(ControlContainer);
  private onChange: (value: any) => void = () => {};
  public onTouched: () => void = () => {};

  value: string = '';
  isDisabled = false;

  ngOnInit(): void {
    // Optional: validate that formControlName exists in form group
    const form = this.controlContainer?.control as FormGroup;
    if (this.formControlName && !form?.get(this.formControlName)) {
      console.warn(`FormControl '${this.formControlName}' not found in parent form group.`);
    }
  }

  writeValue(value: any): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  handleInput(event: Event): void {
    const newValue = (event.target as HTMLTextAreaElement).value;
    this.value = newValue;
    this.onChange(newValue);
  }
}
