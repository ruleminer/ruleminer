import { Component, Input, Output, EventEmitter, inject, SimpleChanges, OnChanges } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, FormControl, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DxButtonModule, DxSelectBoxModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { faFolderPlus } from '@fortawesome/pro-solid-svg-icons';

import { ConditionRowComponent } from '../condition-row/condition-row.component';
import { RolapCloseIconComponent } from '../../../rolap-close-icon/rolap-close-icon.component';
import { FilterField, GroupFormValue, ConditionFormValue, FilterDataType, ConditionFormGroup, GroupFormGroup, FilterCondition } from '../../filter-builder.types';
import { ConditionsCheckboxesModel } from '../conditions-checkboxes/conditions-checkboxes.component';

@Component({
  selector: 'rolap-condition-group',
  standalone: true,
  imports: [
    ConditionRowComponent,
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxButtonModule,
    TranslateModule,
    RolapCloseIconComponent,
    FontAwesomeModule
  ],
  templateUrl: './condition-group.component.html',
  styleUrls: ['./condition-group.component.scss'],
  host: {
    '[class]': 'getHostClasses()'
  }
})
export class ConditionGroupComponent implements OnChanges {
  @Input({ required: true }) groupForm!: GroupFormGroup;
  @Input({ required: true }) availableFields: FilterField[] = [];
  @Input({ required: true }) maxGroupLevel: number = 3;
  @Input({ required: true }) currentLevel: number = 0;
  @Input() rowIndex: number | null = null;
  @Input() getAvailableAttributesToCompare: ((currentFieldName: string | null) => FilterField[]) | undefined;
  @Output() remove = new EventEmitter<void>();
  @Output() conditionsCheckboxesChange = new EventEmitter<ConditionsCheckboxesModel>();
  @Output() filterValueChange = new EventEmitter<any>();
  @Input() isExpertRules: boolean = false;
  @Input() model: any;
  @Input() filterValue: any;
  @Input() fields: any[] = [];

  public isRoot: boolean = false;
  public faPlus = faPlus;
  public faFolderPlus = faFolderPlus;

  private readonly fb = inject(FormBuilder);

  ngOnChanges(simpleChanges: SimpleChanges): void {
    if (simpleChanges['currentLevel']) {
      this.isRoot = this.currentLevel === 0;
    }
  }

  get typedGroupForm(): GroupFormGroup {
    return this.groupForm;
  }

  public getHostClasses(): string {
    let classes = 'condition-group';
    if (this.currentLevel === 2) {
      classes += ' level-' + this.currentLevel;
    }
    return classes;
  }

  public get rules(): FormArray | null {
    if (this.groupForm) {
      const rulesControl = this.groupForm.get('rules');
      if (rulesControl instanceof FormArray) {
        return rulesControl;
      }
    }

    return null;
  }

  public get canAddGroup(): boolean {
    return this.maxGroupLevel === -1 || this.currentLevel < this.maxGroupLevel;
  }

  private createConditionGroup(): ConditionFormGroup {
    return this.fb.group<ConditionFormValue>({
      field: new FormControl<string | null>('', Validators.required),
      operator: new FormControl<string | null>('', Validators.required),
      value: new FormControl<any | null>(null),
      valueEnd: new FormControl<any | null>(null),
      dataType: new FormControl<FilterDataType | null | undefined>(FilterDataType.Text)
    });
  }

  private createGroupGroup(): GroupFormGroup {
    const rulesArray = this.fb.array<ConditionFormGroup | GroupFormGroup>([]);
    return this.fb.group<GroupFormValue>({
      condition: new FormControl<FilterCondition>(FilterCondition.AND, { nonNullable: true }),
      rules: rulesArray
    });
  }

  public addCondition(): void {
    // Get the actual rules FormArray from the input groupForm
    const actualRules = this.groupForm?.get('rules') as FormArray | undefined;
    if (actualRules instanceof FormArray) {
      actualRules.push(this.createConditionGroup());
      this.groupForm.markAsDirty();
    }
  }

  public addGroup(): void {
    if (this.canAddGroup) {
      const actualRules = this.groupForm?.get('rules') as FormArray | undefined;
      if (actualRules instanceof FormArray) {
        actualRules.push(this.createGroupGroup());
        this.groupForm.markAsDirty();
      }
    }
  }

  public removeRule(index: number): void {
    const actualRules = this.groupForm?.get('rules') as FormArray | undefined;
    if (actualRules instanceof FormArray) {
      actualRules.removeAt(index);
      this.groupForm.markAsDirty();
    }
  }

  public removeGroup(): void {
    this.remove.emit();
  }

  public isGroup(control: AbstractControl | null): control is GroupFormGroup {
    return !!control && control instanceof FormGroup && control.get('condition') instanceof FormControl && control.get('rules') instanceof FormArray;
  }

  public canShowRemoveButton(): boolean {
    if (this.isRoot) return true;
    if (!this.rules) return false;
    return this.rules.length > 0;
  }

  public onFilterValueChange(event: any): void {
    this.filterValueChange.emit(event);
  }

  public onConditionRowModelChange(model: ConditionsCheckboxesModel): void {
    this.conditionsCheckboxesChange.emit(model);
  }
}