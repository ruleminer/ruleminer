import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { filterOutNullish } from '../../../utils/rxjsUtils';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, map, take, takeUntil } from 'rxjs/operators';

import { TranslateModule } from '@ngx-translate/core';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxRadioGroupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { cloneDeep } from 'lodash';

import { EDITOR_STATE_SERVICE_TOKEN } from '../../../../main/project/project-rules/project-rules-table/project-rules-table-editor/service/editor-state/editor-state.provider';
import {
  Operator as CompoundOperator,
  Subcondition,
  SubconditionType,
} from '../../../../main/project/project-rules/project-rules-table/project-rules-table-editor/types/rules-editor';
import { UndoRedoButtonsComponent } from '../../../components/undo-redo-buttons/undo-redo-buttons.component';
import {
  ConditionFormGroup,
  ConditionFormValue,
  FilterCondition,
  FilterDataType,
  FilterField,
  FilterOperator,
  GroupFormGroup,
  GroupFormValue,
  OperatorDefinition,
} from '../../filter-builder.types';
import { FilterConfigurationService } from '../../services/filter-configuration.service';
import { UndoRedoService } from '../../services/undo-redo.service';
import { ConditionGroupComponent } from '../condition-group/condition-group.component';
import { ConditionsCheckboxesModel } from '../conditions-checkboxes/conditions-checkboxes.component';
import { isAttrOperatorFn } from '../../utils/filter-builder.utils';

export interface FilterFieldWithId extends FilterField {
  id: number;
}

export interface CorrectedSubcondition extends Subcondition {
  operator?: CompoundOperator;
}

@Component({
  selector: 'rolap-filter-builder-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConditionGroupComponent,
    TranslateModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxButtonModule,
    DxCheckBoxModule,
    DxRadioGroupModule,
    UndoRedoButtonsComponent,
  ],
  templateUrl: './filter-builder-container.component.html',
  styleUrls: ['./filter-builder-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBuilderContainerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) fields: FilterFieldWithId[] = [];
  @Input({ required: true }) maxGroupLevel: number = -1;
  @Input() isExpertRules: boolean = false;
  @Input() model: ConditionsCheckboxesModel | null = null;

  @Output() conditionsCheckboxesChange = new EventEmitter<ConditionsCheckboxesModel>();
  @Output() structuredFilterChange = new EventEmitter<Subcondition[]>();

  public filterForm: GroupFormGroup | null = null;
  public processedFields: FilterFieldWithId[] = [];
  private fieldsById = new Map<number, FilterFieldWithId>();
  private fieldsByDataField = new Map<string, FilterFieldWithId>();

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private configService = inject(FilterConfigurationService);
  private cdr = inject(ChangeDetectorRef);
  public editorStateService = inject(EDITOR_STATE_SERVICE_TOKEN);
  private undoRedoService = inject(UndoRedoService);

  private initialValue$ = toObservable(this.editorStateService.subconditionsSignal);
  private initialValue: Subcondition[] = [];
  private sub: Subscription;
  private isApplyingUndoRedo = false;

  public canUndo$ = this.undoRedoService.canUndo$;
  public canRedo$ = this.undoRedoService.canRedo$;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields']) {
      this.processFieldsInput();
      this.initialValue$
        .pipe(filterOutNullish(), take(1), takeUntil(this.destroy$))
        .subscribe((value: Subcondition[]) => {
          this.initialValue = value;
          this.initForm();
          if (this.filterForm) {
            this.updateExistingRowsFieldData(this.filterForm);
          }
          const initialFormValue = this.filterForm?.getRawValue() || null;
          this.undoRedoService.initializeHistory(this.initialValue, initialFormValue);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onConditionGroupModelChange(model: ConditionsCheckboxesModel): void {
    this.conditionsCheckboxesChange.emit(model);
  }

  public undo(): void {
    const previousState = this.undoRedoService.undo();
    if (previousState) {
      this.applyStateFromHistory(previousState);
    }
  }

  public redo(): void {
    const nextState = this.undoRedoService.redo();
    if (nextState) {
      this.applyStateFromHistory(nextState);
    }
  }

  private applyStateFromHistory(historyState: { formValue: unknown; subconditions: Subcondition[] | null }): void {
    this.isApplyingUndoRedo = true;
    
    if (historyState.formValue) {
      // Try to recreate form from stored form value (works for both valid and invalid states)
      this.filterForm = this.recreateFormFromFormValue(historyState.formValue);
    } else if (historyState.subconditions) {
      // Fallback to subconditions if form value is not available
      this.filterForm = this.convertSubconditionsToFormGroup(historyState.subconditions);
    } else {
      // Last resort - create empty form
      console.warn('Cannot restore form state - no form value or subconditions available');
      this.filterForm = this.fb.group<GroupFormValue>({
        condition: new FormControl<FilterCondition>(FilterCondition.AND, { nonNullable: true }),
        rules: this.fb.array<AbstractControl>([]),
      });
    }
    
    if (this.filterForm) {
      this.updateExistingRowsFieldData(this.filterForm);
    }
    this.subscribeToFormChanges();
    
    // Emit the current state based on what we have
    if (historyState.subconditions) {
      this.emitCurrentStateFromHistory(historyState.subconditions);
    } else {
      // For invalid states, try to emit what we can
      this.emitCurrentState();
    }
    
    this.cdr.markForCheck();
    this.isApplyingUndoRedo = false;
  }

  private emitCurrentStateFromHistory(state: Subcondition[]): void {
    this.structuredFilterChange.emit(cloneDeep(state));
  }

  /**
   * Recreates a FormGroup from stored raw form values.
   * This allows us to restore invalid form states during undo/redo.
   */
  private recreateFormFromFormValue(formValue: unknown): GroupFormGroup {
    try {
      // Type guard to ensure we have a valid form value structure
      if (!formValue || typeof formValue !== 'object') {
        return this.createEmptyForm();
      }

      const rawValue = formValue as Record<string, unknown>;
      
      // Check if it has the expected structure of a GroupFormValue
      if (!rawValue['condition'] || !Array.isArray(rawValue['rules'])) {
        return this.createEmptyForm();
      }

      // Create the main form group
      const condition = rawValue['condition'] as FilterCondition || FilterCondition.AND;
      const rulesArray = this.fb.array<AbstractControl>([]);

      // Recreate each rule from the stored values
      if (rawValue['rules'] && Array.isArray(rawValue['rules'])) {
        for (const ruleValue of rawValue['rules']) {
          const ruleControl = this.recreateRuleFromValue(ruleValue);
          if (ruleControl) {
            rulesArray.push(ruleControl);
          }
        }
      }

      return this.fb.group<GroupFormValue>({
        condition: new FormControl<FilterCondition>(condition, { nonNullable: true }),
        rules: rulesArray,
      });
    } catch (error) {
      console.warn('Failed to recreate form from stored value:', error);
      return this.createEmptyForm();
    }
  }

  /**
   * Recreates a single rule (condition or group) from stored form value.
   */
  private recreateRuleFromValue(ruleValue: unknown): AbstractControl | null {
    if (!ruleValue || typeof ruleValue !== 'object') {
      return null;
    }

    const rule = ruleValue as Record<string, unknown>;

    // Check if it's a group (has condition and rules)
    if ('condition' in rule && 'rules' in rule) {
      const condition = rule['condition'] as FilterCondition || FilterCondition.AND;
      const rulesArray = this.fb.array<AbstractControl>([]);

      if (Array.isArray(rule['rules'])) {
        for (const childRule of rule['rules']) {
          const childControl = this.recreateRuleFromValue(childRule);
          if (childControl) {
            rulesArray.push(childControl);
          }
        }
      }

      return this.fb.group<GroupFormValue>({
        condition: new FormControl<FilterCondition>(condition, { nonNullable: true }),
        rules: rulesArray,
      });
    }

    // Otherwise, it's a condition (has field, operator, value, etc.)
    if ('field' in rule) {
      const field = rule['field'] as string | null || null;
      const operator = rule['operator'] as FilterOperator | null || null;
      const value = rule['value'] !== undefined ? rule['value'] : null;
      const valueEnd = rule['valueEnd'] !== undefined ? rule['valueEnd'] : null;
      const dataType = rule['dataType'] as FilterDataType | null || null;

      // Determine if value and valueEnd should be disabled
      const operatorDef = operator ? this.configService.getOperator(operator) : null;
      const valueIsRequired = operator ? this.operatorRequiresValue(operator) : false;
      const valueDisabled = !valueIsRequired;
      const valueEndDisabled = !valueIsRequired || operator !== FilterOperator.Between;

      const conditionFG = this.fb.group<ConditionFormValue>({
        field: new FormControl<string | null>(field, Validators.required),
        operator: new FormControl<FilterOperator | null>(operator, Validators.required),
        value: new FormControl<unknown>({ value, disabled: valueDisabled }),
        valueEnd: new FormControl<unknown>({ value: valueEnd, disabled: valueEndDisabled }),
        dataType: new FormControl<FilterDataType | null | undefined>(dataType),
      });

      // Apply validation if we have the operator definition
      if (operatorDef) {
        this.setupValidation(conditionFG, operator, operatorDef);
      }

      return conditionFG;
    }

    return null;
  }

  /**
   * Creates an empty form group as fallback.
   */
  private createEmptyForm(): GroupFormGroup {
    return this.fb.group<GroupFormValue>({
      condition: new FormControl<FilterCondition>(FilterCondition.AND, { nonNullable: true }),
      rules: this.fb.array<AbstractControl>([]),
    });
  }

  private processFieldsInput(): void {
    this.processedFields = Array.isArray(this.fields)
      ? this.fields.map((f) => ({
          ...f,
          id: f.id,
          caption: f.caption || f.dataField || `Field ${f.id}`,
        }))
      : [];

    this.fieldsById.clear();
    this.fieldsByDataField.clear();
    this.processedFields.forEach((field) => {
      if (field.id === undefined) {
        console.error('Field is missing an ID during processing:', field);
      } else {
        this.fieldsById.set(field.id, field);
      }
      if (field.dataField) {
        this.fieldsByDataField.set(field.dataField, field);
      } else {
        console.error('Field is missing a dataField during processing:', field);
      }
    });
  }

  private initForm(): void {
    this.filterForm = this.convertSubconditionsToFormGroup(this.initialValue);
    this.subscribeToFormChanges();
    this.cdr.markForCheck();
  }

  private subscribeToFormChanges(): void {
    if (!this.filterForm) {
      console.warn('subscribeToFormChanges: filterForm is null, cannot subscribe to changes.');
      return;
    }

    this.sub?.unsubscribe();
    this.sub = this.filterForm.valueChanges
      .pipe(
        map(() => this.filterForm?.getRawValue()),
        debounceTime(300),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.emitCurrentState();
      });
  }

  private emitCurrentState(): void {
    if (!this.filterForm) {
      this.cdr.markForCheck();
      return;
    }

    // Always capture the form state for undo/redo, regardless of validity
    const currentFormValue = this.filterForm.getRawValue();
    
    // Only emit structured filter and process validation if form is valid
    if (this.filterForm.valid) {
      const structuredFilter = this.convertFormValueToNodeStructure(cloneDeep(this.filterForm));
      if (structuredFilter) {
        this.structuredFilterChange.emit(structuredFilter);
        if (!this.isApplyingUndoRedo) {
          this.undoRedoService.addSnapshot(currentFormValue, structuredFilter);
        }
      } else {
        console.warn('Structured filter conversion resulted in null.');
        // Still add snapshot even if conversion failed
        if (!this.isApplyingUndoRedo) {
          this.undoRedoService.addSnapshot(currentFormValue, null);
        }
      }
    } else {
      // Form is invalid - still add snapshot but don't emit structured filter
      if (!this.isApplyingUndoRedo) {
        this.undoRedoService.addSnapshot(currentFormValue, null);
      }
    }
    
    this.cdr.markForCheck();
  }

  private convertSubconditionsToFormGroup(initialValue: Subcondition[]): GroupFormGroup {
    const rulesControls = initialValue.map((sub) => this.mapSubconditionToAbstractControl(sub, 1));
    if (rulesControls && rulesControls.length > 0) {
      return rulesControls[0] as GroupFormGroup;
    }
    return this.fb.group<GroupFormValue>({
      condition: new FormControl<FilterCondition>(FilterCondition.AND, { nonNullable: true }),
      rules: this.fb.array<AbstractControl>([]),
    });
  }

  private mapBackendOperatorToFilterOperator(backendOp: string, negated: boolean, isNumeric: boolean): FilterOperator | null {
    if (!isNumeric) {
        return negated ? FilterOperator.NotEqualsAttr : FilterOperator.EqualsAttr;
    }

    if (negated) {
        const negationMap: Record<string, FilterOperator> = {
            '=': FilterOperator.NotEqualsAttr,
            '>': FilterOperator.LessThanOrEqualAttr,
            '>=': FilterOperator.LessThanAttr,
            '<' : FilterOperator.GreaterThanOrEqualAttr,
            '<=': FilterOperator.GreaterThanAttr
        };
        return negationMap[backendOp] || null;
    } else {
        const map: Record<string, FilterOperator> = {
            '=': FilterOperator.EqualsAttr,
            '>': FilterOperator.GreaterThanAttr,
            '>=': FilterOperator.GreaterThanOrEqualAttr,
            '<' : FilterOperator.LessThanAttr,
            '<=': FilterOperator.LessThanOrEqualAttr
        };
        return map[backendOp] || null;
    }
  }

  private mapSubconditionToAbstractControl(
    subcondition: Subcondition,
    level: number,
  ): GroupFormGroup | ConditionFormGroup | null {
  if (subcondition.type === SubconditionType.Compound) {
      if (this.maxGroupLevel >= 0 && level > this.maxGroupLevel) {
        console.warn(`Max group level (${this.maxGroupLevel}) reached. Skipping nested group:`, subcondition);
        return null;
      }
      const subconditionOperator = (subcondition as any).operator as CompoundOperator | undefined;
      const groupCondition = subconditionOperator === 'CONJUNCTION' ? FilterCondition.AND : FilterCondition.OR;
      let effectiveGroupCondition = groupCondition;

      if (subcondition.negated) {
        effectiveGroupCondition = groupCondition === FilterCondition.AND ? FilterCondition.OR : FilterCondition.AND;
      }

      const childRules: AbstractControl[] = [];
      if (subcondition.subconditions) {
        for (const childSub of subcondition.subconditions) {
          const childToProcess = {
            ...childSub,
            attributes: childSub.attributes,
            negated: subcondition.negated ? !childSub.negated : childSub.negated,
          };
          const control = this.mapSubconditionToAbstractControl(childToProcess as Subcondition, level + 1);
          if (control) {
            childRules.push(control as any);
          }
        }
      }

      return this.fb.group<GroupFormValue>({
        condition: new FormControl<FilterCondition>(effectiveGroupCondition, { nonNullable: true }),
        rules: this.fb.array(childRules),
      });
  } else if (subcondition.type === SubconditionType.ElementaryNominal || subcondition.type === SubconditionType.ElementaryNumerical) {
      let fieldDef: FilterFieldWithId | undefined;
      const attributeIdentifier =
        subcondition.attributes && subcondition.attributes.length > 0 ? subcondition.attributes[0] : undefined;

      if (attributeIdentifier === undefined) {
        console.warn(`Subcondition attributes array is empty or undefined. Subcondition:`, subcondition);
        return null;
      }

      if (typeof attributeIdentifier === 'number') {
        fieldDef = this.fieldsById.get(attributeIdentifier);
      } else {
        console.warn(
          `Attribute identifier is not a number as expected from Subcondition.attributes. Type: ${typeof attributeIdentifier}. Subcondition:`,
          subcondition,
        );
        return null;
      }

      if (!fieldDef) {
        console.warn(
          `Cannot find FilterField for attribute identifier '${attributeIdentifier}'. Subcondition:`,
          subcondition,
        );
        return null;
      }

      const { operator, value, valueEnd } = this.determineOperatorAndValuesFromSubcondition(
        subcondition,
        fieldDef.dataType,
        fieldDef,
      );

      if (!operator) {
        console.warn(`Could not determine operator for subcondition:`, subcondition, `(Field: ${fieldDef.dataField})`);
        return null;
      }

      const opDef = this.configService.getOperator(operator);
      const valueIsRequired = this.operatorRequiresValue(operator);
      const valueDisabled = !valueIsRequired;
      const valueEndDisabled = !valueIsRequired || operator !== FilterOperator.Between;

      const conditionFG = this.fb.group<ConditionFormValue>({
        field: new FormControl<string | null>(fieldDef.dataField, Validators.required),
        operator: new FormControl<FilterOperator | null>(operator, Validators.required),
        value: new FormControl<any | null>({ value, disabled: valueDisabled }),
        valueEnd: new FormControl<any | null>({ value: valueEnd, disabled: valueEndDisabled }),
        dataType: new FormControl<FilterDataType | null | undefined>(fieldDef.dataType),
      });

      this.setupValidation(conditionFG, operator, opDef);
      return conditionFG;
  } else if ((subcondition as any).type === SubconditionType.Attributes || (subcondition as any).type === SubconditionType.NominalAttributesEquality) {
        const sub = subcondition as any;
        if (!sub.attributes || sub.attributes.length < 2) {
            console.warn('Attribute comparison subcondition missing attributes:', sub);
            return null;
        }
      const [firstAttrId, secondAttrId] = sub.attributes as [number, number];
      const secondAttrName = this.fieldsById.get(secondAttrId)?.dataField || null;
        const fieldDef = this.fieldsById.get(firstAttrId);
        if (!fieldDef) {
            console.warn(`Cannot find FilterField for attribute ID '${firstAttrId}'.`);
            return null;
        }

  const isNumeric = sub.type === SubconditionType.Attributes;
        const operator = this.mapBackendOperatorToFilterOperator(sub.operator, sub.negated, isNumeric);

        if (!operator) {
            console.warn(`Could not map backend operator:`, sub);
            return null;
        }

        const opDef = this.configService.getOperator(operator);
        const conditionFG = this.fb.group<ConditionFormValue>({
            field: new FormControl<string | null>(fieldDef.dataField, Validators.required),
            operator: new FormControl<FilterOperator | null>(operator, Validators.required),
            value: new FormControl<any | null>(secondAttrName),
            valueEnd: new FormControl<any | null>({ value: null, disabled: true }),
            dataType: new FormControl<FilterDataType | null | undefined>(fieldDef.dataType),
        });

        this.setupValidation(conditionFG, operator, opDef);
        return conditionFG;
    }
    console.warn('Unhandled subcondition type or null subcondition:', subcondition);
    return null;
  }

  private determineOperatorAndValuesFromSubcondition(
    subcondition: Subcondition,
    dataType: FilterDataType,
    fieldDef?: FilterFieldWithId,
  ): { operator: FilterOperator | null; value: any; valueEnd?: any } {
    let baseOp: FilterOperator | null = null;
    let finalValue: any = null;
    let finalValueEnd: any = undefined;

    if (subcondition.type === 'elementary_numerical') {
      if (subcondition.left !== null && subcondition.right !== null) {
        if (subcondition.left === subcondition.right && subcondition.left_closed && subcondition.right_closed) {
          baseOp = FilterOperator.Equals;
          finalValue = subcondition.left;
        } else {
          baseOp = FilterOperator.Between;
          finalValue = subcondition.left;
          finalValueEnd = subcondition.right;
        }
      } else if (subcondition.left !== null) {
        finalValue = subcondition.left;
        baseOp = subcondition.left_closed ? FilterOperator.GreaterThanOrEqual : FilterOperator.GreaterThan;
      } else if (subcondition.right !== null) {
        finalValue = subcondition.right;
        baseOp = subcondition.right_closed ? FilterOperator.LessThanOrEqual : FilterOperator.LessThan;
      } else if (subcondition.value !== undefined && subcondition.value !== null) {
        baseOp = FilterOperator.Equals;
        finalValue = Number(subcondition.value);
        if (isNaN(finalValue)) {
          console.warn(
            `Numerical subcondition 'value' is NaN for field '${fieldDef?.dataField || 'unknown'}':`,
            subcondition.value,
          );
          return { operator: null, value: null };
        }
      } else {
        baseOp = FilterOperator.IsNull;
      }
    } else if (subcondition.type === 'elementary_nominal') {
      if (dataType === FilterDataType.Boolean) {
        const valStr = String(subcondition.value).toLowerCase();
        if (valStr === 'true') {
          baseOp = FilterOperator.IsTrue;
        } else if (valStr === 'false') {
          baseOp = FilterOperator.IsFalse;
        } else if (subcondition.value === null || subcondition.value === undefined) {
          baseOp = FilterOperator.IsNull;
        } else {
          console.warn(
            `Value '${subcondition.value}' for Boolean field '${
              fieldDef?.dataField || 'unknown'
            }' is not standard 'true'/'false' or null/undefined. Defaulting to IsNull.`,
          );
          baseOp = FilterOperator.IsNull;
        }
      } else {
        if (subcondition.value === null || subcondition.value === undefined) {
          baseOp = FilterOperator.IsNull;
        } else {
          baseOp = FilterOperator.Equals;
          finalValue = subcondition.value;
        }
      }
    }

    if (!baseOp) {
      console.warn(
        `CRITICAL: Base operator remained null for subcondition. Type: '${subcondition.type}', Value: '${
          subcondition.value
        }', DataType: '${dataType}', Field: '${fieldDef?.dataField || 'unknown'}'`,
      );
      return { operator: null, value: null };
    }

    const currentBaseOp = baseOp as FilterOperator;
    const finalOperator = subcondition.negated ? this.getNegatedOperator(currentBaseOp) : currentBaseOp;

    if (
      currentBaseOp === FilterOperator.IsTrue ||
      currentBaseOp === FilterOperator.IsFalse ||
      currentBaseOp === FilterOperator.IsNull ||
      currentBaseOp === FilterOperator.IsNotNull
    ) {
      finalValue = null;
    }

    return { operator: finalOperator, value: finalValue, valueEnd: finalValueEnd };
  }

  private getNegatedOperator(operator: FilterOperator): FilterOperator {
    const map: Partial<Record<FilterOperator, FilterOperator>> = {
      [FilterOperator.Equals]: FilterOperator.NotEquals,
      [FilterOperator.NotEquals]: FilterOperator.Equals,
      [FilterOperator.GreaterThan]: FilterOperator.LessThanOrEqual,
      [FilterOperator.GreaterThanOrEqual]: FilterOperator.LessThan,
      [FilterOperator.LessThan]: FilterOperator.GreaterThanOrEqual,
      [FilterOperator.LessThanOrEqual]: FilterOperator.GreaterThan,
      [FilterOperator.IsNull]: FilterOperator.IsNotNull,
      [FilterOperator.IsNotNull]: FilterOperator.IsNull,
      [FilterOperator.IsTrue]: FilterOperator.IsFalse,
      [FilterOperator.IsFalse]: FilterOperator.IsTrue,
    };
    if (operator === FilterOperator.Between) {
      console.warn(
        `Negation for '${FilterOperator.Between}' is complex and not directly mapped by getNegatedOperator. The 'negated' flag on the Subcondition should be handled by the consumer if complex 'NOT BETWEEN' logic is required.`,
      );
      return FilterOperator.Between;
    }
    return map[operator] || operator;
  }

  private setupValidation(
    formGroup: FormGroup,
    operator: FilterOperator | null,
    opDef: OperatorDefinition | undefined,
  ): void {
    const valueControl = formGroup.get('value');
    const valueEndControl = formGroup.get('valueEnd');
    if (!valueControl) return;

    const requiresValue = operator ? this.operatorRequiresValue(operator) : false;

    valueControl.clearValidators();
    valueEndControl?.clearValidators();

    if (requiresValue) {
      valueControl.setValidators([Validators.required]);
      valueControl.enable({ emitEvent: false });
      if (operator === FilterOperator.Between) {
        valueEndControl?.setValidators([Validators.required]);
        valueEndControl?.enable({ emitEvent: false });
        formGroup.setValidators((control: AbstractControl) => {
          const start = control.get('value')?.value;
          const end = control.get('valueEnd')?.value;
          if (start === null || end === null || start === undefined || end === undefined) {
            return { required: true };
          }
          if (Number(start) > Number(end)) {
            return { invalidRange: true };
          }
          return null;
        });
      } else {
        valueEndControl?.disable({ emitEvent: false });
        valueEndControl?.setValue(null, { emitEvent: false });
        formGroup.clearValidators();
      }
    } else {
      valueControl.disable({ emitEvent: false });
      valueControl.setValue(null, { emitEvent: false });
      valueEndControl?.disable({ emitEvent: false });
      valueEndControl?.setValue(null, { emitEvent: false });
      formGroup.clearValidators();
    }

    valueControl.updateValueAndValidity({ emitEvent: false });
    valueEndControl?.updateValueAndValidity({ emitEvent: false });
    formGroup.updateValueAndValidity({ emitEvent: false });
  }

private getUniqueAttributeIds(subconditions: Subcondition[]): number[] {
    const ids = new Set<number>();

    const findIds = (conditions: any[]) => {
        if (!Array.isArray(conditions)) return;

        for (const condition of conditions) {
            if (!condition) continue;

            if (condition.attributes && Array.isArray(condition.attributes)) {
                condition.attributes.forEach((id: any) => {
                    if (typeof id === 'number') {
                        ids.add(id);
                    }
                });
            }

            if (condition.subconditions && Array.isArray(condition.subconditions)) {
                findIds(condition.subconditions);
            }
        }
    };

    findIds(subconditions);
    return Array.from(ids).sort((a, b) => a - b);
}


private convertFormValueToNodeStructure(formGroup: GroupFormGroup | ConditionFormGroup | null): Subcondition[] {
    if (!formGroup || !formGroup.valid) {
        if (formGroup && !formGroup.valid) {
            console.warn('convertFormValueToNodeStructure: formGroup is invalid', formGroup.errors, formGroup.value);
        }
        return [];
    }

    let resultingRootSubcondition: Subcondition | null = null;

    if (this.isGroupFormGroup(formGroup)) {
        const groupConditionValue = (formGroup.get('condition') as FormControl<FilterCondition>).value;
        const rulesArray = formGroup.get('rules') as FormArray;
        const mappedSubconditions = rulesArray.controls
            .map((ruleControl) => this.convertRuleToSubcondition(ruleControl as ConditionFormGroup | GroupFormGroup))
            .filter((subcondition) => subcondition !== null) as Subcondition[];

        const uniqueIds = this.getUniqueAttributeIds(mappedSubconditions); // <-- FIX

        resultingRootSubcondition = {
            type: SubconditionType.Compound,
            operator: groupConditionValue === FilterCondition.AND ? 'CONJUNCTION' : 'ALTERNATIVE',
            subconditions: mappedSubconditions,
            attributes: uniqueIds,
            negated: false,
            value: undefined,
            left: null,
            right: null,
            left_closed: false,
            right_closed: false,
        } as Subcondition;
    } else if (this.isConditionFormGroup(formGroup)) {
        const elementarySubcondition = this.convertRuleToSubcondition(formGroup as ConditionFormGroup);
        if (elementarySubcondition) {
            const uniqueIds = this.getUniqueAttributeIds([elementarySubcondition]); 
            resultingRootSubcondition = {
                type: SubconditionType.Compound,
                operator: 'CONJUNCTION',
                subconditions: [elementarySubcondition],
                attributes: uniqueIds,
                negated: false,
                value: undefined,
                left: null,
                right: null,
                left_closed: false,
                right_closed: false,
            } as Subcondition;
        }
    } else {
        console.warn('Unknown form group structure in convertFormValueToNodeStructure:', formGroup);
    }

    if (resultingRootSubcondition) {
        return [resultingRootSubcondition];
    } else {
        return [];
    }
}

private convertRuleToSubcondition(ruleControl: ConditionFormGroup | GroupFormGroup): Subcondition | null {
    if (!ruleControl || !ruleControl.valid) {
        return null;
    }

    if (this.isGroupFormGroup(ruleControl)) {
        const groupForm = ruleControl as GroupFormGroup;
        const conditionValue = groupForm.controls.condition.value;
        const rulesArray = groupForm.controls.rules;

        const nestedSubconditions = rulesArray.controls
            .map((nestedRuleCtrl) => this.convertRuleToSubcondition(nestedRuleCtrl as ConditionFormGroup | GroupFormGroup))
            .filter((subcond) => subcond !== null) as Subcondition[];

        if (nestedSubconditions.length === 0 && ruleControl !== this.filterForm && rulesArray.controls.length > 0) {
            return null;
        }
        
        const uniqueIds = this.getUniqueAttributeIds(nestedSubconditions); // <-- FIX

        return {
            type: SubconditionType.Compound,
            attributes: uniqueIds,
            negated: false,
            operator: conditionValue === FilterCondition.AND ? 'CONJUNCTION' : 'ALTERNATIVE',
            subconditions: nestedSubconditions,
            value: undefined,
            left: null,
            right: null,
            left_closed: false,
            right_closed: false,
        } as Subcondition;
    } else if (this.isConditionFormGroup(ruleControl)) {
        const conditionForm = ruleControl as ConditionFormGroup;
        const fieldValue = conditionForm.controls.field.value;
        const formOperator = conditionForm.controls.operator.value as FilterOperator | null;
        const formDataType = conditionForm.controls.dataType?.value as FilterDataType | null | undefined;
        const formValue = conditionForm.controls.value.value;
        const formValueEnd = conditionForm.controls.valueEnd?.value;

        if (!fieldValue || !formOperator || !formDataType) {
            return null;
        }

        const fieldDef = this.fieldsByDataField.get(fieldValue);
        if (!fieldDef) {
            return null;
        }

        const isAttrOperator = isAttrOperatorFn(formOperator);
        if (isAttrOperator) {
            const firstAttrId = fieldDef.id;
            const secondAttrValue = formValue;

            if (secondAttrValue === null || secondAttrValue === undefined) {
                return null;
            }

            const secondAttrDef = typeof secondAttrValue === 'number'
                ? this.fieldsById.get(secondAttrValue)
                : this.fieldsByDataField.get(secondAttrValue);

            if (!secondAttrDef) {
                console.warn(`Could not find attribute definition for value: ${secondAttrValue}`);
                return null;
            }
            const secondAttrId = secondAttrDef.id;

            if (formDataType === FilterDataType.Numeric) {
                const { operator, negated } = this.mapFilterOperatorToBackend(formOperator);
                return {
                    type: SubconditionType.Attributes,
                    attributes: [firstAttrId, secondAttrId],
                    negated: negated,
                    operator: operator,
                } as any;
            } else {
                return {
                    type: SubconditionType.NominalAttributesEquality,
                    attributes: [firstAttrId, secondAttrId],
                    negated: formOperator === FilterOperator.NotEqualsAttr,
                } as any;
            }
        }

    const outputSubcondition: Subcondition = {
      type: formDataType === FilterDataType.Numeric ? SubconditionType.ElementaryNumerical : SubconditionType.ElementaryNominal,
            attributes: [fieldDef.id],
            negated: false,
            value: undefined,
            left: null,
            right: null,
            left_closed: false,
            right_closed: false,
        };

        switch (formOperator) {
            case FilterOperator.NotEquals:
            case FilterOperator.IsNotNull:
            case FilterOperator.IsFalse:
                outputSubcondition.negated = true;
                break;
            default:
                outputSubcondition.negated = false;
                break;
        }

        if (this.operatorRequiresValue(formOperator)) {
            let finalValueForOutput: string | number | undefined = undefined;
            let valueMappedToLeftRight = false;

            if (formOperator === FilterOperator.Between) {
                if (formDataType === FilterDataType.Numeric) {
                    outputSubcondition.left = formValue !== null && formValue !== undefined ? Number(formValue) : null;
                    outputSubcondition.right =
                        formValueEnd !== null && formValueEnd !== undefined ? Number(formValueEnd) : null;
                    outputSubcondition.left_closed = true;
                    outputSubcondition.right_closed = true;
                }
                valueMappedToLeftRight = true;
            } else if (formDataType === FilterDataType.Numeric) {
                const numericFormValue = formValue !== null && formValue !== undefined ? Number(formValue) : null;

                switch (formOperator) {
                    case FilterOperator.GreaterThan:
                        outputSubcondition.left = numericFormValue;
                        outputSubcondition.left_closed = false;
                        valueMappedToLeftRight = true;
                        break;
                    case FilterOperator.GreaterThanOrEqual:
                        outputSubcondition.left = numericFormValue;
                        outputSubcondition.left_closed = true;
                        valueMappedToLeftRight = true;
                        break;
                    case FilterOperator.LessThan:
                        outputSubcondition.right = numericFormValue;
                        outputSubcondition.right_closed = false;
                        valueMappedToLeftRight = true;
                        break;
                    case FilterOperator.LessThanOrEqual:
                        outputSubcondition.right = numericFormValue;
                        outputSubcondition.right_closed = true;
                        valueMappedToLeftRight = true;
                        break;
                    case FilterOperator.Equals:
                    case FilterOperator.NotEquals:
                        if (numericFormValue !== null && !isNaN(numericFormValue)) {
                            finalValueForOutput = numericFormValue;
                        }
                        break;
                    default:
                        if (numericFormValue !== null && !isNaN(numericFormValue)) {
                            finalValueForOutput = numericFormValue;
                        }
                        break;
                }
            } else if (formDataType === FilterDataType.Boolean) {
                if (formValue !== null && formValue !== undefined) {
                    if (typeof formValue === 'string') {
                        if (formValue.toLowerCase() === 'true') finalValueForOutput = 'true';
                        else if (formValue.toLowerCase() === 'false') finalValueForOutput = 'false';
                    } else {
                        finalValueForOutput = formValue ? 'true' : 'false';
                    }
                }
            } else {
                if (formValue !== null && formValue !== undefined) {
                    finalValueForOutput = String(formValue);
                }
            }

            if (!valueMappedToLeftRight) {
                outputSubcondition.value = finalValueForOutput;
            } else {
                outputSubcondition.value = undefined;
            }
        } else {
            outputSubcondition.value = undefined;
        }
        return outputSubcondition;
    }
    return null;
}

  private mapFilterOperatorToBackend(formOperator: FilterOperator): { operator: string, negated: boolean } {
      const mapping: Record<string, { op: string, neg: boolean }> = {
          [FilterOperator.EqualsAttr]: { op: '=', neg: false },
          [FilterOperator.GreaterThanAttr]: { op: '>', neg: false },
          [FilterOperator.GreaterThanOrEqualAttr]: { op: '>=', neg: false },
          [FilterOperator.LessThanAttr]: { op: '<', neg: false },
          [FilterOperator.LessThanOrEqualAttr]: { op: '<=', neg: false },
      };

      const result = mapping[formOperator];
      if (result) {
          return { operator: result.op, negated: result.neg };
      }

      if (formOperator === FilterOperator.NotEqualsAttr) {
          return { operator: '=', negated: true };
      }

      console.warn(`No backend mapping for operator: ${formOperator}`);
      return { operator: '=', negated: false };
  }


  private updateExistingRowsFieldData(groupOrArray: FormGroup | FormArray): void {
    if (groupOrArray instanceof FormArray) {
      groupOrArray.controls.forEach((control) => {
        if (control instanceof FormGroup) {
          this.updateExistingRowsFieldData(control);
        }
      });
    } else if (this.isGroupFormGroup(groupOrArray)) {
      const rulesControl = groupOrArray.get('rules');
      if (rulesControl instanceof FormArray) {
        this.updateExistingRowsFieldData(rulesControl);
      }
    } else if (this.isConditionFormGroup(groupOrArray)) {
      const conditionGroup = groupOrArray as ConditionFormGroup;
      const fieldNameCtrl = conditionGroup.controls.field;
      const currentDataTypeCtrl = conditionGroup.controls.dataType;
      const operatorCtrl = conditionGroup.controls.operator;

      if (!fieldNameCtrl.value) return;

      const fieldDef = this.fieldsByDataField.get(fieldNameCtrl.value);

      if (fieldDef) {
        const newDataType = this.configService.getEffectiveDataType(fieldDef);
        if (currentDataTypeCtrl?.value !== newDataType) {
          currentDataTypeCtrl?.setValue(newDataType, { emitEvent: false });
        }

        const currentOperator = operatorCtrl.value as FilterOperator | null;
        const opDef = currentOperator ? this.configService.getOperator(currentOperator) : undefined;
        this.setupValidation(conditionGroup, currentOperator, opDef);

        operatorCtrl.updateValueAndValidity({ emitEvent: false });
        conditionGroup.controls.value.updateValueAndValidity({ emitEvent: false });
        if (conditionGroup.controls.valueEnd) {
          conditionGroup.controls.valueEnd.updateValueAndValidity({ emitEvent: false });
        }
        fieldNameCtrl.setErrors(null);
      } else {
        console.warn(`Field ${fieldNameCtrl.value} not found in updated fields list.`);
        fieldNameCtrl.setErrors({ fieldNotFound: true });
        operatorCtrl.setValue(null, { emitEvent: false });
        conditionGroup.controls.value.setValue(null, { emitEvent: false });
        if (conditionGroup.controls.valueEnd) {
          conditionGroup.controls.valueEnd.setValue(null, { emitEvent: false });
        }
      }
      conditionGroup.updateValueAndValidity({ emitEvent: false });
    }
  }

  public getAvailableAttributesToCompare(currentFieldName: string | null): FilterFieldWithId[] {
    if (!currentFieldName) {
        return this.processedFields;
    }
    const currentField = this.fieldsByDataField.get(currentFieldName);
    if (!currentField) {
        return this.processedFields;
    }
    
    // For attribute comparisons, allow all fields except the current one
    // This enables cross-type comparisons (e.g., numerical vs nominal attributes)
    return this.processedFields.filter(field => field.id !== currentField.id);
  }

  public getOperatorsForConditionField(fieldDataFieldValue: string | null): FilterOperator[] {
    if (!fieldDataFieldValue) {
      return [];
    }
    const fieldDef = this.fieldsByDataField.get(fieldDataFieldValue);
    if (fieldDef) {
      return this.getAvailableOperators(fieldDef);
    }
    console.warn(`Field definition not found for dataField: ${fieldDataFieldValue} while getting operators.`);
    return [];
  }

  public ruleControlAsFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  public isConditionFormGroup(control: AbstractControl | null): control is ConditionFormGroup {
    return !!control && control instanceof FormGroup && 'field' in control.controls && 'operator' in control.controls;
  }

  public ruleControlAsConditionFormGroup(control: AbstractControl): ConditionFormGroup {
    return control as ConditionFormGroup;
  }

  public isGroupFormGroup(control: AbstractControl | null): control is GroupFormGroup {
    return !!control && control instanceof FormGroup && 'condition' in control.controls && 'rules' in control.controls;
  }

  public ruleControlAsGroupFormGroup(control: AbstractControl): GroupFormGroup {
    return control as GroupFormGroup;
  }

  public getAvailableOperators(field: FilterField): FilterOperator[] {
    const dataType = this.configService.getEffectiveDataType(field);

    if (field.filterOperations && field.filterOperations.length > 0) {
      const definedOperatorValues = Object.values(FilterOperator) as string[];
      return field.filterOperations
        .map((opStr) => opStr as FilterOperator)
        .filter((op) => definedOperatorValues.includes(op));
    }

    switch (dataType) {
      case FilterDataType.Text:
      case FilterDataType.List:
        return [
          FilterOperator.Equals,
          FilterOperator.NotEquals,
          FilterOperator.IsNull,
          FilterOperator.IsNotNull,
          FilterOperator.EqualsAttr,
          FilterOperator.NotEqualsAttr,
        ];
      case FilterDataType.Numeric:
        return [
          FilterOperator.Equals,
          FilterOperator.NotEquals,
          FilterOperator.GreaterThan,
          FilterOperator.LessThan,
          FilterOperator.GreaterThanOrEqual,
          FilterOperator.LessThanOrEqual,
          FilterOperator.Between,
          FilterOperator.IsNull,
          FilterOperator.IsNotNull,
          FilterOperator.EqualsAttr,
          FilterOperator.NotEqualsAttr,
          FilterOperator.GreaterThanAttr,
          FilterOperator.LessThanAttr,
          FilterOperator.GreaterThanOrEqualAttr,
          FilterOperator.LessThanOrEqualAttr,
        ];
      case FilterDataType.Boolean:
        return [
          FilterOperator.IsTrue,
          FilterOperator.IsFalse,
          FilterOperator.Equals,
          FilterOperator.NotEquals,
          FilterOperator.IsNull,
          FilterOperator.IsNotNull,
          FilterOperator.EqualsAttr,
          FilterOperator.NotEqualsAttr,
        ];
      default:
        return [FilterOperator.IsNull, FilterOperator.IsNotNull];
    }
  }

  private operatorRequiresValue(operator: FilterOperator): boolean {
    const noValueOperators = [
      FilterOperator.IsNull,
      FilterOperator.IsNotNull,
      FilterOperator.IsTrue,
      FilterOperator.IsFalse,
      FilterOperator.IsNullAttr,
      FilterOperator.IsNotNullAttr,
      FilterOperator.IsTrueAttr,
      FilterOperator.IsFalseAttr,
    ];
    return !noValueOperators.includes(operator);
  }
}
