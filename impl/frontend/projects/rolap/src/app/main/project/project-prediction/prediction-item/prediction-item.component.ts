import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { map, reduce, replace } from 'lodash';

import {
  AppState,
  ConfusionMatrix,
  GeneralIndicators,
  PredictionIndicator,
} from '../../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../../common/store/project/project.selectors';
import { ProblemTypes } from '../../../data-upload/utils/enums';

export type PredictionItem = { [key: string]: string | number | undefined };

@Component({
  selector: 'rolap-prediction-item',
  templateUrl: './prediction-item.component.html',
  styleUrls: ['./prediction-item.component.scss'],
})
export class PredictionItemComponent implements OnInit, OnChanges, OnDestroy {
  @Input() indicator: GeneralIndicators | PredictionIndicator;
  @Input() title: string | any;
  @Input() show = false;
  public confusionMatrix: PredictionItem[];
  public predictedRateData: any;
  public confusionMatrixDataSource: DataSource<PredictionItem>;
  public isClassification: boolean;
  public showConfusionMatrix: boolean;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>) {}

  get shouldDisplayConfusionMatrix(): boolean {
    return this.isClassification && this.confusionMatrix.length > 0;
  }

  ngOnInit(): void {
    this.setupProblemType();
    this.setData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['indicator']) {
      this.setData();
      this.updateShowConfusionMatrix();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setData(): void {
    const { Confusion_matrix, ...table } = this.indicator;
    if ('Covered_by_prediction' in table && 'Not_covered_by_prediction' in table) {
      delete (table as any).Covered_by_prediction;
      delete (table as any).Not_covered_by_prediction;
    }

    this.predictedRateData = table;
    this.confusionMatrix = this.convertToObjectArray(Confusion_matrix).splice(0, 10);
    this.confusionMatrixDataSource = new DataSource({
      store: new ArrayStore({
        data: this.confusionMatrix,
      }),
    });
  }

  private convertToObjectArray(input: ConfusionMatrix | undefined): PredictionItem[] {
    if (!input || !input.classes) return [];

    const indexToClassMap: { [index: number]: string } = reduce(
      input.classes,
      (result, className: string, index) => ({ ...result, [index]: className }),
      {},
    );
    return map(input.classes, (currentClass, i) => {
      const newData: PredictionItem = reduce(
        input.classes,
        (result, className, j) => {
          const sanitizedClassName = replace(indexToClassMap[j], /\./g, ',');
          return {
            ...result,
            [sanitizedClassName]: input[currentClass][j],
          };
        },
        {},
      );
      return newData;
    });
  }

  private setupProblemType(): void {
    this.store
      .select(activeProjectSelector)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((activeProject) => {
        this.isClassification = activeProject.type_of_problem === ProblemTypes.Classification;
        this.updateShowConfusionMatrix();
      });
  }

  private updateShowConfusionMatrix() {
    this.showConfusionMatrix = this.show && this.confusionMatrix.length > 0;
  }
}
