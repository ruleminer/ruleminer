import { Component, EventEmitter, Input, Output } from '@angular/core';

import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { FilteringRule, VisibleRule } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/types';

@Component({
  selector: 'rolap-rule-chips',
  templateUrl: './rule-chips.component.html',
  styleUrls: ['./rule-chips.component.scss'],
})
export class RuleChipsComponent {
  @Input() rule: VisibleRule | FilteringRule;
  @Input() showRemoveButton: boolean = false;
  @Output() onRemoveClick = new EventEmitter();
  public faTimes = faTimes;

  public onRuleRemoveClick() {
    this.onRemoveClick.emit();
  }
}
