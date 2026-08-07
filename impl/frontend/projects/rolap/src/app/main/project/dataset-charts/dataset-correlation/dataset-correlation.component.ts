import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';

import { ReplaySubject, Subject, Subscription, combineLatestWith, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { Item } from 'devextreme/ui/button_group';

import { CorrelationMatrix } from '../../models/project';
import { DatasetChartsService } from '../service/dataset-charts.service';

enum DisplayTypes {
  Matrix = 'matrix',
  Table = 'table',
  Ranking = 'ranking',
}

interface DisplayTypeButtonGroupItem extends Item {
  displayType: DisplayTypes;
}

@Component({
  selector: 'rolap-dataset-correlation',
  templateUrl: './dataset-correlation.component.html',
  styleUrls: ['./dataset-correlation.component.scss'],
})
export class DatasetCorrelationComponent implements OnChanges, OnDestroy {
  @Input() dataSetId: number;
  @Output() correlationLoadingChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  public correlationMatrix: CorrelationMatrix;
  public readonly DisplayTypes = DisplayTypes;
  public displayTypes: DisplayTypeButtonGroupItem[];
  public selectedDisplayType: DisplayTypes;
  public displayBigMatrixInfo = false;
  private correlationMatrixFetched: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private ngUnsubscribe = new Subject<void>();
  private correlationMatrixDataSubscription: Subscription;
  // Correlation matrix size threshold above which we don't display the heatmap
  private readonly HEATMAP_DISPLAY_SIZE_THRESHOLD = 20;
  // Correlation table size threshold above which we don't display the table
  private readonly TABLE_DISPLAY_SIZE_THRESHOLD = 100;
  constructor(private translate: TranslateService, private chartsService: DatasetChartsService) {
    this.translate.onLangChange
      .pipe(combineLatestWith(this.correlationMatrixFetched), takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.setupDisplayTypes();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['dataSetId'] || !this.dataSetId) return;
    this.getCorrelationMatrix();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.correlationMatrixFetched.complete();
  }

  public selectDisplayType(event: any) {
    this.selectedDisplayType = event.itemData.displayType;
  }

  private setupDisplayTypes() {
    const displayTypes = [];
    if (this.correlationMatrix.x.length <= this.HEATMAP_DISPLAY_SIZE_THRESHOLD) {
      // Matrix / heatmap display only available for small correlation matrices
      displayTypes.unshift({
        icon: 'smalliconslayout',
        displayType: DisplayTypes.Matrix,
        text: this.translate.instant(`visualisation.correlation_matrix.display_types.${DisplayTypes.Matrix}`),
      });
    } else {
      this.displayBigMatrixInfo = true;
    }
    if (this.correlationMatrix.x.length <= this.TABLE_DISPLAY_SIZE_THRESHOLD) {
      // Table display only available for correlation matrices up to 100 rows
      displayTypes.push({
        icon: 'splitcells',
        displayType: DisplayTypes.Table,
        text: this.translate.instant(`visualisation.correlation_matrix.display_types.${DisplayTypes.Table}`),
      });
      this.selectedDisplayType = DisplayTypes.Table;
    }
    // ranking display is always available
    displayTypes.push({
      icon: 'detailslayout',
      displayType: DisplayTypes.Ranking,
      text: this.translate.instant(`visualisation.correlation_matrix.display_types.${DisplayTypes.Ranking}`),
    });

    if (this.correlationMatrix.x.length <= this.HEATMAP_DISPLAY_SIZE_THRESHOLD) {
      this.selectedDisplayType = DisplayTypes.Matrix;
    } else if (this.correlationMatrix.x.length <= this.TABLE_DISPLAY_SIZE_THRESHOLD) {
      this.selectedDisplayType = DisplayTypes.Table;
    } else {
      // ranking display is default for big correlation matrices
      this.selectedDisplayType = DisplayTypes.Ranking;
    }

    this.displayTypes = displayTypes;
  }

  private getCorrelationMatrix() {
    // maybe we should implement storage here too?
    this.correlationMatrixDataSubscription?.unsubscribe();
    this.correlationMatrixDataSubscription = this.chartsService
      .getCorrelationMatrix(this.dataSetId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: CorrelationMatrix) => {
        this.correlationMatrix = data;
        this.correlationMatrixFetched.next(true);
        this.setupDisplayTypes();
        this.correlationLoadingChange.emit(false);
      });
  }
}
