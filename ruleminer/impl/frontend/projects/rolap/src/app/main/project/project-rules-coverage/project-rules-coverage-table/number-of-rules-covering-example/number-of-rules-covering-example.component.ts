import { Component, Input, ViewChild } from '@angular/core';

import { DxTooltipComponent } from 'devextreme-angular';
import { nanoid } from 'nanoid';
import { VisibleRule } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';

@Component({
  selector: 'rolap-number-of-rules-covering-example',
  templateUrl: './number-of-rules-covering-example.component.html',
  styleUrls: ['./number-of-rules-covering-example.component.scss'],
})
export class NumberOfRulesCoveringExampleComponent {
  @Input() rules: VisibleRule[];
  @ViewChild(DxTooltipComponent) tooltip: DxTooltipComponent;
  public id: string = `number-of-rules-covering-example--${nanoid()}`;

  /* Fix: ROLAP-1775 - Normal way of showing and hiding dxtooltip doesn't work in this component
  for unknown reasons. Using Angular events bindings solves the problem. */
  public showTooltip() {
    this.tooltip?.instance?.show();
  }

  public hideTooltip() {
    this.tooltip?.instance?.hide();
  }
}
