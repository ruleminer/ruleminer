import { Component, OnInit } from '@angular/core';

import { AbstractExpertAttributeSelectModal } from '../abstract-expert-attribute-select-modal.component';

@Component({
  selector: 'rolap-expert-forbidden-attribute-select-modal',
  templateUrl: './expert-forbidden-attribute-select-modal.component.html',
  styleUrls: ['./expert-forbidden-attribute-select-modal.component.scss'],
})
export class ExpertForbiddenAttributeSelectModalComponent extends AbstractExpertAttributeSelectModal implements OnInit {
  public onAttributesSelectionChange(selectedAttributes: string[], decisionClass?: string) {
    if (decisionClass) {
      (this.model as { [decisionClass: string]: string[] })[decisionClass] = selectedAttributes;
    } else {
      this.model = selectedAttributes;
    }
    this.updateSelectedAttributesCounts();
  }
}
