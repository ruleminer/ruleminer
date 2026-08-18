import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';

import { Subscription } from 'rxjs';

import { DxTextBoxComponent } from 'devextreme-angular';

import { FieldName } from '../../../../../../common/components/validation-message/validation-message.component';
import { CustomTitleRuleSetValidation } from '../../../../../data-upload/utils/formValidators';
import { getLocalDateTime } from '../../../../../data-upload/utils/utils';
import { RulesetNameChangeEvent } from './types';

@Component({
  selector: 'rolap-ruleset-generation-name',
  templateUrl: './ruleset-generation-name.component.html',
  styleUrls: ['./ruleset-generation-name.component.scss'],
})
export class RulesetGenerationNameComponent implements OnChanges {
  @Input({ required: true }) dataSetName: string;
  @Output() nameChange = new EventEmitter<RulesetNameChangeEvent>();
  public readonly FieldName = FieldName;
  public nameFormControl = new FormControl<string>('', CustomTitleRuleSetValidation);
  private nameFormControlSubscription?: Subscription;
  private destroyRef = inject(DestroyRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSetName'] && this.dataSetName) {
      this.subscribeToNameFormControlValueChanges();
      const initialName = `${this.dataSetName}_${getLocalDateTime()}`;
      this.nameFormControl.setValue(initialName);
    }
  }

  public autoFocusTextBox(textBox: DxTextBoxComponent): void {
    // Using setTimeout to focus textBox control - required for Devexpress
    setTimeout(() => {
      textBox.instance.focus();
    }, 0);
  }

  private subscribeToNameFormControlValueChanges(): void {
    this.nameFormControlSubscription?.unsubscribe();
    this.nameFormControlSubscription = this.nameFormControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name) => {
        const isValid = this.nameFormControl.valid;
        this.nameChange.emit({ name, valid: isValid });
      });
  }
}
