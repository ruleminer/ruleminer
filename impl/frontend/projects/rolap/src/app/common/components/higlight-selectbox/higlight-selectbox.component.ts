import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, inject } from '@angular/core';
import {
  ControlValueAccessor,
  FormControlDirective,
  FormControlName,
  NgControl,
  NgModel,
  ReactiveFormsModule,
} from '@angular/forms';

import { Subscription, combineLatestWith, startWith } from 'rxjs';

import { DxSelectBoxModule } from 'devextreme-angular';

class NoopValueAccessor implements ControlValueAccessor {
  writeValue() {}
  registerOnChange() {}
  registerOnTouched() {}
}

function injectNgControl() {
  const ngControl = inject(NgControl, { self: true, optional: true });

  if (!ngControl) throw new Error('...');

  if (
    ngControl instanceof FormControlDirective ||
    ngControl instanceof FormControlName ||
    ngControl instanceof NgModel
  ) {
    ngControl.valueAccessor = new NoopValueAccessor();

    return ngControl;
  }

  throw new Error(`...`);
}

// This component is a customizable select box that highlights its border based on the validity of the input.
@Component({
  selector: 'rolap-higlight-selectbox',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DxSelectBoxModule],
  template: `
    <div [ngClass]="highlightClass">
      <dx-select-box
        *ngIf="ngControl"
        [formControl]="ngControl.control"
        [dataSource]="selectBoxItems"
        stylingMode="outlined"
        [attr.data-cy]="dataCy" />
    </div>
  `,
  styles: [
    `
      .input-error {
        box-shadow: 0 0 5px rgba(255, 0, 0, 0.7), inset 0 0 3px rgba(255, 0, 0, 0.3);
      }
    `,
  ],
})
export class HiglightSelectboxComponent {
  @Input({ required: true }) formControlName: string = '';
  @Input({ required: true }) selectBoxItems: string[] = [];
  @Input({ required: true }) dataCy: string;
  public ngControl = injectNgControl();
  private subscription: Subscription | undefined;
  public highlightClass: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ngControl) {
      this.highlightClass = 'input-error';
    }

    if (changes['selectBoxItems'] && this.formControlName && this.ngControl && this.ngControl.valueChanges) {
      this.subscription?.unsubscribe();
      const statusChanges$ = this.ngControl.statusChanges?.pipe(startWith(this.ngControl.status));
      const valueChanges$ = this.ngControl.valueChanges?.pipe(startWith(this.ngControl.value));
      this.subscription = statusChanges$?.pipe(combineLatestWith(valueChanges$)).subscribe(([status, value]) => {
        this.setHighlightClass(status, value);
      });
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private setHighlightClass(status: string, value: string | null) {
    this.highlightClass = status === 'INVALID' || !value ? 'input-error' : '';
  }
}
