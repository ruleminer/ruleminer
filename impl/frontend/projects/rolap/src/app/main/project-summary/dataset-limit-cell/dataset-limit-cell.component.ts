import { Component, Input } from '@angular/core';

import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'rolap-dataset-limit-cell',
  templateUrl: './dataset-limit-cell.component.html',
  styleUrls: ['./dataset-limit-cell.component.scss'],
})
export class DatasetLimitCellComponent {
  @Input() value: string;
  @Input() title: string;

  public faTriangleExclamation = faTriangleExclamation;
}
