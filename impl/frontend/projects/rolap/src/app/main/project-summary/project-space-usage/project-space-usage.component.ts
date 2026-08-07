import { Component, Input } from '@angular/core';

import { UserLimits } from '../../project/service/models/account.model';

@Component({
  selector: 'rolap-project-space-usage',
  templateUrl: './project-space-usage.component.html',
  styleUrls: ['./project-space-usage.component.scss'],
})
export class ProjectSpaceUsageComponent {
  @Input() userLimits: UserLimits;

  constructor() {}
}
