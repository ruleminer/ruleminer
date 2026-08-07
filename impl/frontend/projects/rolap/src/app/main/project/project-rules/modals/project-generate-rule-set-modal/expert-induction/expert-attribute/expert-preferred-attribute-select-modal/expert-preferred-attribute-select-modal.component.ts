import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { Modal } from 'projects/rolap/src/app/common/services/modal/modal';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { AbstractExpertAttributeSelectModal } from '../abstract-expert-attribute-select-modal.component';

@Component({
  selector: 'rolap-expert-preffered-attribute-select-modal',
  templateUrl: './expert-preferred-attribute-select-modal.component.html',
  styleUrls: ['./expert-preferred-attribute-select-modal.component.scss'],
})
export class ExpertPreferredAttributeSelectModalComponent extends AbstractExpertAttributeSelectModal implements OnInit {
  public occurrencesModel:
    | { [attributeName: string]: number }
    | { [decisionClass: string]: { [attributeName: string]: number } };

  constructor(private changeDetector: ChangeDetectorRef, modal: Modal<AbstractExpertAttributeSelectModal>) {
    super(modal);
  }

  public onAttributesSelectionChange(selectedAttributes: string[], decisionClass?: string) {
    this.updateOccurrencesModelValue(selectedAttributes, decisionClass);
    this.updateModelValue(selectedAttributes, decisionClass);
    this.updateSelectedAttributesCounts();
  }

  public onOccurrenceChange(value: number, attributeName: string, decisionClass?: string) {
    if (decisionClass) {
      (this.occurrencesModel as any)[decisionClass][attributeName] = value;
    } else {
      this.occurrencesModel[attributeName] = value;
    }
  }

  public removeAttribute(index: number, decisionClass?: string) {
    let fieldModel: string[];
    let occurrencesModel: { [attributeName: string]: number };
    if (decisionClass) {
      fieldModel = (this.model as { [decisionClass: string]: string[] })[decisionClass];
      occurrencesModel = (this.occurrencesModel as any)[decisionClass];
    } else {
      fieldModel = this.model as string[];
      occurrencesModel = this.occurrencesModel as any;
    }
    fieldModel.splice(index, 1);
    delete occurrencesModel[fieldModel[index]];
    this.changeDetector.detectChanges();
  }

  override initializeDataModel() {
    if (this.problemType === ProblemTypes.Classification) {
      this.initializeDataModelForClassification();
    } else {
      this.initializeDataModelForOtherProblems();
    }
  }

  override submitForm(): void {
    this.modal.close(this.occurrencesModel);
  }

  private initializeDataModelForClassification() {
    const modelValue: { [decisionClass: string]: string[] } = {};
    const occurrencesValue: { [decisionClass: string]: { [attributeName: string]: number } } = {};
    this.decisionClasses.forEach((decisionClass, _) => {
      modelValue[decisionClass] = [];
      occurrencesValue[decisionClass] = {};
    });
    if (this.selectedAttributes) {
      Object.keys(this.selectedAttributes).forEach((decisionClass) => {
        modelValue[decisionClass] = Object.keys(this.selectedAttributes[decisionClass]);
        occurrencesValue[decisionClass] = {};
        Object.keys(this.selectedAttributes[decisionClass]).forEach((attributeName) => {
          occurrencesValue[decisionClass][attributeName] = this.selectedAttributes[decisionClass][attributeName];
        });
      });
    }
    this.model = modelValue;
    this.occurrencesModel = occurrencesValue;
  }

  private initializeDataModelForOtherProblems() {
    let modelValue: string[] = [];
    const occurrencesValue: { [attributeName: string]: number } = {};
    if (this.selectedAttributes) {
      modelValue = Object.keys(this.selectedAttributes);
      Object.keys(modelValue).forEach((attributeName) => {
        occurrencesValue[attributeName] = this.selectedAttributes[attributeName];
      });
    }
    this.model = modelValue;
    this.occurrencesModel = occurrencesValue;
  }

  private updateOccurrencesModelValue(selectedAttributes: string[], decisionClass?: string) {
    const oldOccurrences = decisionClass ? (this.occurrencesModel as any)[decisionClass] : this.occurrencesModel;
    const newOccurrences: { [attributeName: string]: number } = {};
    selectedAttributes.forEach((attribute) => {
      newOccurrences[attribute] = oldOccurrences[attribute] ? oldOccurrences[attribute] : 1;
    });
    if (decisionClass) {
      (this.occurrencesModel as any)[decisionClass] = newOccurrences;
    } else {
      this.occurrencesModel = newOccurrences;
    }
  }

  private updateModelValue(selectedAttributes: string[], decisionClass?: string) {
    if (decisionClass) {
      (this.model as { [decisionClass: string]: string[] })[decisionClass] = selectedAttributes;
    } else {
      this.model = selectedAttributes;
    }
  }
}
