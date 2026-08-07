import { Component } from '@angular/core';

import { faCircle, faCircleCheck } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'rolap-selection-marker',
  templateUrl: './selection-marker.component.html',
  styleUrls: ['./selection-marker.component.scss'],
})
export class SelectionMarkerComponent {
  public faCircle = faCircle;
  public faCircleCheck = faCircleCheck;
}
