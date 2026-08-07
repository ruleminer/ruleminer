import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { Ids } from '../../../../../store/ruleSets/rulesets.selectors';
import { Label } from '../../../../label/interfaces/label.model';

@Component({
  selector: 'rolap-rules-and-conditions-info',
  templateUrl: './rules-and-conditions-info.component.html',
  styleUrls: ['./rules-and-conditions-info.component.scss'],
})
export class RulesAndConditionsInfoComponent implements OnChanges {
  @Input() labels: Label[];
  @Input() ids: Ids;
  @Input() uuid: string;
  @Input() autoIncrement: number;
  @Input() ruleString: string;
  public hasLabels: boolean;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['labels']) {
      this.hasLabels = this.labels && this.labels.length > 0;
    }
  }
}
