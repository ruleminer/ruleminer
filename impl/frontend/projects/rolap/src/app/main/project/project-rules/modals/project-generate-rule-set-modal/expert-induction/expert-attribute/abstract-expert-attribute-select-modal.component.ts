import { Directive, Input, OnInit } from '@angular/core';

import { Modal } from 'projects/rolap/src/app/common/services/modal/modal';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

type SelectedAttributes = string[];
type ClassificationSelectedAttributes = { [decisionClass: string]: string[] };
type ModelType = SelectedAttributes | ClassificationSelectedAttributes;

@Directive()
export abstract class AbstractExpertAttributeSelectModal implements OnInit {
  @Input() selectedAttributes: any;
  @Input() attributesChoice: string[];
  @Input() problemType: ProblemTypes;
  @Input() classDistribution: { [className: string]: number };
  @Input() initialClass: string;

  public ProblemTypes = ProblemTypes;
  public decisionClasses: string[];
  public model: ModelType;
  public selectedAttributesCounts: { [className: string]: number } = {};

  constructor(public modal: Modal<AbstractExpertAttributeSelectModal>) {}

  ngOnInit(): void {
    if (this.problemType === ProblemTypes.Classification && this.classDistribution) {
      this.decisionClasses = Object.keys(this.classDistribution);
    }
    this.initializeDataModel();
    this.updateSelectedAttributesCounts();
  }

  public submitForm() {
    this.modal.close(this.model);
  }

  protected initializeDataModel() {
    if (this.selectedAttributes) {
      this.model = JSON.parse(JSON.stringify(this.selectedAttributes));
    } else {
      if (this.problemType === ProblemTypes.Classification) {
        const model: { [decisionClass: string]: string[] } = {};
        this.decisionClasses.forEach((className) => (model[className] = []));
        this.model = model;
      } else {
        this.model = [];
      }
    }
  }

  public updateSelectedAttributesCounts() {
    if (this.problemType !== ProblemTypes.Classification) return;
    const selectedAttributesCounts: { [className: string]: number } = {};
    const model = this.model as ClassificationSelectedAttributes;
    Object.keys(model).forEach((className) => {
      if (Array.isArray(model[className])) {
        selectedAttributesCounts[className] = model[className].length;
      } else {
        selectedAttributesCounts[className] = Object.keys(model[className]).length;
      }
    });
    this.selectedAttributesCounts = selectedAttributesCounts;
  }
}
