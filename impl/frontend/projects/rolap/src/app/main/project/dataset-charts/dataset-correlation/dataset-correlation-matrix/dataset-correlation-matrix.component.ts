import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';

import { take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { nanoid } from 'nanoid';
import { PlotyHeatmapHelper } from 'projects/rolap/src/app/common/modules/visualisation/helpers/ploty-heatmap-helper';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { CorrelationMatrix } from '../../../models/project';
import { AbstractDatasetChartComponent } from '../../abstract-dataset-chart-component';

@Component({
  selector: 'rolap-dataset-correlation-matrix',
  templateUrl: './dataset-correlation-matrix.component.html',
  styleUrls: ['./dataset-correlation-matrix.component.scss'],
})
export class DatasetCorrelationMatrixComponent extends AbstractDatasetChartComponent implements OnChanges {
  @Input() correlationMatrix: CorrelationMatrix;
  public id = nanoid();
  public loading = true;

  constructor(private changeDetector: ChangeDetectorRef, store: Store<AppState>) {
    super(store);
  }

  ngOnChanges(): void {
    if (!this.correlationMatrix) return;
    this.draw();
  }

  protected draw(): void {
    if (!this.correlationMatrix) return;
    this.loading = true;
    this.viewInitialized.pipe(take(1), takeUntil(this.ngUnsubscribe)).subscribe(() => {
      const plotData = {
        ...{
          x: this.correlationMatrix.x,
          y: this.correlationMatrix.y,
          z: this.correlationMatrix.z,
        },
        titleX: '',
        titleY: '',
        labelX: this.correlationMatrix.x,
        labelY: this.correlationMatrix.y,
        type: 'heatmap',
        hoverongaps: false,
      };

      PlotyHeatmapHelper.drawHeatmap(plotData, `dataset-correlation-matrix--${this.id}`);
      this.loading = false;
      this.changeDetector.detectChanges();
    });
  }
  protected override handleResize(): void {
    this.draw();
  }
}
