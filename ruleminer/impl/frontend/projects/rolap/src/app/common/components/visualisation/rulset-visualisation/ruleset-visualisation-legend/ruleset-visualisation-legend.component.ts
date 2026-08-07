import { Component, Input } from '@angular/core';

import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { V2RulesTableMeta } from '../../../../store/v2RulesTable/types';

@Component({
  selector: 'rolap-ruleset-visualisation-legend',
  templateUrl: './ruleset-visualisation-legend.component.html',
  styleUrls: ['./ruleset-visualisation-legend.component.scss'],
})
export class RulesetVisualisationLegendComponent {
  @Input() meta: V2RulesTableMeta;
  @Input() classDescription: string;
  @Input() problemType: ProblemTypes;
}
