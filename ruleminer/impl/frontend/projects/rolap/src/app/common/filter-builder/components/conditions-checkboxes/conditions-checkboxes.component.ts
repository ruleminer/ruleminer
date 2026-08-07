import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxFilterBuilderModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipComponent } from '../../../components/tooltip/tooltip.component';

export enum ConditionsCheckboxesTypes {
  refine = 'refine',
  determine = 'determine',
}

export interface ConditionsCheckboxesModel {
  [ConditionsCheckboxesTypes.refine]: boolean[];
  [ConditionsCheckboxesTypes.determine]: boolean[];
}

@Component({
  selector: 'rolap-conditions-checkboxes',
  standalone: true,
  imports: [CommonModule, DxFilterBuilderModule, TranslateModule, TooltipComponent],
  templateUrl: './conditions-checkboxes.component.html',
})
export class ConditionsCheckboxesComponent {
  @Input() isExpertRules = false;
  @Input() model: ConditionsCheckboxesModel = {
    [ConditionsCheckboxesTypes.refine]: [false],
    [ConditionsCheckboxesTypes.determine]: [false]
  };
  @Output() conditionsCheckboxesChange = new EventEmitter<ConditionsCheckboxesModel>();

  public conditionTypes = ConditionsCheckboxesTypes;

  private initializeModel(): void {
    if (!this.model || Object.keys(this.model).length === 0) {
      this.model = {
        [ConditionsCheckboxesTypes.refine]: [false],
        [ConditionsCheckboxesTypes.determine]: [false]
      };
    }

    if (!this.model[ConditionsCheckboxesTypes.refine] || !Array.isArray(this.model[ConditionsCheckboxesTypes.refine])) {
      this.model[ConditionsCheckboxesTypes.refine] = [false];
    }

    if (!this.model[ConditionsCheckboxesTypes.determine] || !Array.isArray(this.model[ConditionsCheckboxesTypes.determine])) {
      this.model[ConditionsCheckboxesTypes.determine] = [false];
    }

    if (this.model[ConditionsCheckboxesTypes.refine].length === 0) {
      this.model[ConditionsCheckboxesTypes.refine] = [false];
    }

    if (this.model[ConditionsCheckboxesTypes.determine].length === 0) {
      this.model[ConditionsCheckboxesTypes.determine] = [false];
    }
  }

  public updateCheckbox(type: ConditionsCheckboxesTypes, index: number, event: Event): void {
    this.initializeModel();

    const checked = (event.target as HTMLInputElement).checked;
    this.model[type][index] = checked;

    if (checked) {
      const otherType = type === ConditionsCheckboxesTypes.refine ?
        ConditionsCheckboxesTypes.determine :
        ConditionsCheckboxesTypes.refine;

      this.model[otherType][index] = false;
    }

    this.conditionsCheckboxesChange.emit({ ...this.model });
  }
}