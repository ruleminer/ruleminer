import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import DataSource from 'devextreme/data/data_source';

import { PredictionItem } from '../prediction-item.component';

@Component({
  selector: 'rolap-predicted-condition',
  templateUrl: './predicted-condition.component.html',
  styleUrls: ['./predicted-condition.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PredictedConditionComponent implements OnChanges {
  @Input() show: boolean;
  @Input() confusionMatrix: PredictionItem[];
  @Input() dataSource: DataSource<PredictionItem>;
  public enableConfusionMatrix: boolean;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['confusionMatrix']) this.checkConfusionMatrix();
  }

  public customizeColumns(columns: DxiDataGridColumn[]): void {
    columns.forEach((column) => {
      column.alignment = 'left';
      column.headerCellTemplate = 'headerCellTemplate';
    });
  }

  private checkConfusionMatrix(): void {
    this.enableConfusionMatrix = this.confusionMatrix.length >= 10 ? false : true;
  }
}
