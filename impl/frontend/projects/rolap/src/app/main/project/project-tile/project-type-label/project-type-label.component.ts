import { Component, Input } from '@angular/core';

import { ProblemTypes } from '../../../data-upload/utils/enums';

@Component({
  selector: 'rolap-project-type-label',
  templateUrl: './project-type-label.component.html',
  styleUrls: ['./project-type-label.component.scss'],
})
export class ProjectTypeLabelComponent {
  @Input() type: ProblemTypes;
}
