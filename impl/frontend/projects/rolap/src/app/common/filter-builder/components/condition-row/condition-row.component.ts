import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation, inject, DestroyRef } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { startWith, distinctUntilChanged } from 'rxjs';
import { FilterField, OperatorDefinition, FilterDataType, ConditionFormValue } from '../../filter-builder.types';
import { FilterConfigurationService } from '../../services/filter-configuration.service';
import { FieldSelectorComponent } from './field-selector/field-selector.component';
import { OperatorSelectorComponent } from './operator-selector/operator-selector.component';
import { ValueInputComponent } from './value-input/value-input.component';
import { updateFilterValueValidation } from '../../utils/filter-builder.utils';
import { RolapCloseIconComponent } from '../../../rolap-close-icon/rolap-close-icon.component';
import { ConditionsCheckboxesComponent, ConditionsCheckboxesModel } from '../conditions-checkboxes/conditions-checkboxes.component';
import { AttrMinMaxValueInfoComponent } from '../attr-min-max-value-info/attr-min-max-value-info.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterOperator } from '../../filter-builder.types';

@Component({
  selector: 'rolap-condition-row',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FieldSelectorComponent,
    OperatorSelectorComponent,
    ValueInputComponent,
    RolapCloseIconComponent,
    ConditionsCheckboxesComponent,
    AttrMinMaxValueInfoComponent
  ],
  templateUrl: './condition-row.component.html',
  styleUrls: ['./condition-row.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConditionRowComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  @Input({ required: true }) conditionForm!: FormGroup;
  @Input({ required: true }) availableFields: FilterField[] = [];
  @Input() rowIndex: number | null = null;
  @Input() showRemoveButton: boolean = true;
  @Output() remove = new EventEmitter<void>();
  @Input() isExpertRules: boolean = false;
  @Input() model: any;
  @Input() filterValue: any;
  @Input() fields: any[] = [];
  @Input() getAvailableAttributesToCompare: ((currentFieldName: string | null) => FilterField[]) | undefined;
  @Output() filterValueChange = new EventEmitter<any>();
  @Output() conditionsCheckboxesChange = new EventEmitter<ConditionsCheckboxesModel>();

  public availableOperators: OperatorDefinition[] = [];
  public selectedField: FilterField | undefined;
  public effectiveDataType: FilterDataType | undefined;
  public isValueRequired: boolean = true;
  public isBetweenOperator: boolean = false;

  public fieldControl!: FormControl;
  public operatorControl!: FormControl;
  public valueControl!: FormControl;
  public valueEndControl: FormControl | undefined;

  get typedConditionForm(): FormGroup<ConditionFormValue> {
    return this.conditionForm as FormGroup<ConditionFormValue>;
  }

  private configService = inject(FilterConfigurationService);
  private fb = inject(FormBuilder);

  private _prevOperator: FilterOperator | null = null;

  public ngOnInit(): void {
    if (!this.conditionForm) {
      console.error("ConditionRowComponent requires conditionForm input");
      this.conditionForm = this.fb.group({
        field: [null, Validators.required],
        operator: [null, Validators.required],
        value: [null],
        valueEnd: [null],
        dataType: [undefined]
      });
      return;
    }

    this.fieldControl = this.typedConditionForm.get('field') as FormControl;
    this.operatorControl = this.typedConditionForm.get('operator') as FormControl;
    this.valueControl = this.typedConditionForm.get('value') as FormControl;
    this.valueEndControl = this.typedConditionForm.get('valueEnd') as FormControl | undefined;

    this.fieldControl.valueChanges.pipe(
      startWith(this.fieldControl.value),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(fieldValue => {
      this.selectedField = this.availableFields.find(f => f.dataField === fieldValue);
      this.effectiveDataType = this.selectedField ? this.configService.getEffectiveDataType(this.selectedField) : undefined;
      this.typedConditionForm.patchValue({ dataType: this.effectiveDataType }, { emitEvent: false });

      const isInitialLoad = !this.typedConditionForm.dirty && this.operatorControl.value !== null;
      if (!isInitialLoad) {
        this.operatorControl.setValue(null, { emitEvent: true });
        this.valueControl.setValue(null, { emitEvent: false });
        if (this.typedConditionForm.contains('valueEnd')) {
          this.typedConditionForm.get('valueEnd')?.setValue(null, { emitEvent: false });
        }
        this.valueControl.clearValidators(); this.valueControl.updateValueAndValidity({ emitEvent: false });
        if (this.typedConditionForm.contains('valueEnd')) {
          this.typedConditionForm.get('valueEnd')?.clearValidators();
          this.typedConditionForm.get('valueEnd')?.updateValueAndValidity({ emitEvent: false });
        }
      }

      this.availableOperators = this.selectedField
        ? this.configService.getOperatorsForField(this.selectedField)
        : [];

      if (!isInitialLoad && this.availableOperators.length === 1) {
        this.operatorControl.setValue(this.availableOperators[0].value, { emitEvent: true });
      } else if (!isInitialLoad) {
        this.operatorControl.setValue(null, { emitEvent: true });
      } else {
        this.operatorControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      }

    });

    this.operatorControl.valueChanges.pipe(
      startWith(this.operatorControl.value),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(operatorInternalValue => {
      const normalOperators = FilterConfigurationService.normalOperators;
      const attrOperators = FilterConfigurationService.attrOperators;
      const prevOperator = this._prevOperator;
      this._prevOperator = operatorInternalValue;
      const switchedBetweenSets =
        (prevOperator !== null && normalOperators.includes(prevOperator as string) && attrOperators.includes(operatorInternalValue as string)) ||
        (prevOperator !== null && attrOperators.includes(prevOperator as string) && normalOperators.includes(operatorInternalValue as string));
      if (switchedBetweenSets) {
        this.valueControl.setValue(null, { emitEvent: false });
        if (this.valueEndControl) {
          this.valueEndControl.setValue(null, { emitEvent: false });
        }
      }

      if (!operatorInternalValue) {
        this.isValueRequired = false;
        this.isBetweenOperator = false;
        this.updateValueEndControl();
        updateFilterValueValidation(
          this.valueControl,
          this.typedConditionForm.get('valueEnd') as FormControl | undefined,
          this.isValueRequired,
          this.isBetweenOperator,
          this.effectiveDataType,
          operatorInternalValue
        );
        return;
      }
      const operatorDef = operatorInternalValue ? this.configService.getOperator(operatorInternalValue) : null;
      this.isValueRequired = operatorDef?.requiresValue ?? false;
      this.isBetweenOperator = operatorDef?.value === 'between';
      this.updateValueEndControl();
      updateFilterValueValidation(
        this.valueControl,
        this.typedConditionForm.get('valueEnd') as FormControl | undefined,
        this.isValueRequired,
        this.isBetweenOperator,
        this.effectiveDataType,
        operatorInternalValue
      );
    });
  }

  private updateValueEndControl(): void {
    if (this.isBetweenOperator && !this.typedConditionForm.contains('valueEnd')) {
      const valueEndControl = new FormControl<unknown | null>(null);
      this.typedConditionForm.addControl('valueEnd', valueEndControl);
      this.valueEndControl = valueEndControl;

      if (this.valueEndControl && !this.valueEndControl.enabled) {
        this.valueEndControl.enable();
      }
    }
    else if (!this.isBetweenOperator && this.typedConditionForm.contains('valueEnd')) {
      const currentValue = this.typedConditionForm.get('valueEnd')?.value;
      this.typedConditionForm.removeControl('valueEnd');
      this.valueEndControl = undefined;

      if (currentValue !== null && currentValue !== undefined) {
        this.typedConditionForm.addControl('valueEnd', new FormControl({
          value: currentValue,
          disabled: !this.isBetweenOperator
        }));
        this.valueEndControl = this.typedConditionForm.get('valueEnd') as FormControl;
      }
    }

    if (this.valueEndControl) {
      updateFilterValueValidation(
        this.valueControl,
        this.valueEndControl,
        this.isValueRequired,
        this.isBetweenOperator,
        this.effectiveDataType,
        this.operatorControl.value
      );
    }
  }

  public onRemove(): void {
    this.remove.emit();
  }

  public onFieldChange(fieldValue: string): void {
    this.selectedField = this.availableFields.find(f => f.dataField === fieldValue);
    this.effectiveDataType = this.selectedField ? this.configService.getEffectiveDataType(this.selectedField) : undefined;
    this.typedConditionForm.patchValue({ dataType: this.effectiveDataType }, { emitEvent: false });
    this.availableOperators = this.selectedField
      ? this.configService.getOperatorsForField(this.selectedField)
      : [];
  }

  public onOperatorChange(operatorValue: string): void {
    const operatorDef = this.configService.getOperator(operatorValue);
    this.isValueRequired = operatorDef?.requiresValue ?? false;
    this.isBetweenOperator = operatorDef?.value === 'between';
  }

  public onConditionsCheckboxesModelChange(model: ConditionsCheckboxesModel): void {
    this.conditionsCheckboxesChange.emit(model);
  }
}
