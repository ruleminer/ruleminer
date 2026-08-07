import { Component, Input, OnChanges } from '@angular/core';

import { defaultDevExtremePageSizes } from '../../../../../common/utils/dataGridUtils';
import { CorrelationMatrix } from '../../../models/project';

interface CorrelationRankingItem {
  first: string;
  second: string;
  correlation: number;
}

@Component({
  selector: 'rolap-dataset-correlation-ranking',
  templateUrl: './dataset-correlation-ranking.component.html',
  styleUrls: ['./dataset-correlation-ranking.component.scss'],
})
export class DatasetCorrelationRankingComponent implements OnChanges {
  @Input() correlationMatrix: CorrelationMatrix;
  public data: CorrelationRankingItem[];
  public readonly allowedPageSizes: number[] = defaultDevExtremePageSizes;
  public pageSize: number = this.allowedPageSizes[0];

  ngOnChanges() {
    if (!this.correlationMatrix) return;
    this.prepareData(this.correlationMatrix);
  }

  private prepareData(correlationMatrix: CorrelationMatrix) {
    const dataMap: Map<string, CorrelationRankingItem> = new Map();
    correlationMatrix.x.forEach((x: string, i: number) => {
      correlationMatrix.y.forEach((y: string, j: number) => {
        if (x === y) return;

        // safe because "$" is not allowed in column names
        const key = [x, y].sort().join(' $ ');
        dataMap.set(key, {
          first: x,
          second: y,
          correlation: correlationMatrix.z[i][j],
        });
      });
    });
    this.data = Array.from(dataMap.values());
  }
}
