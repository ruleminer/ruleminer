import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { Subject, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState, GeneralIndicators, PredictionIndicators } from 'projects/rolap/src/app/common/store/app-state.model';

import { activeProjectSelector } from '../../../../common/store/project/project.selectors';
import { ProblemTypes } from '../../../data-upload/utils/enums';

@Component({
  selector: 'rolap-dataset-tables',
  templateUrl: './dataset-tables.component.html',
  styleUrls: ['./dataset-tables.component.scss'],
})
export class DatasetTablesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() showFirstTable = true;
  @Input() predictionIndicators: PredictionIndicators;
  @Input() generalIndicators: GeneralIndicators;

  public arePredictionIndicatorsEmpty = true;
  public problemType: ProblemTypes;
  public specificDecisionClass: string;
  public predictionPercentage: number | null;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store
      .select(activeProjectSelector)
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe((activeProject) => {
        this.problemType = activeProject.type_of_problem;
      });

    this.setSpecificDecisionClass();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['predictionIndicators']) this.setArePredictionIndicatorsEmpty();
    this.calculateCoveredByPrediction(this.generalIndicators);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setArePredictionIndicatorsEmpty(): void {
    this.arePredictionIndicatorsEmpty = Object.keys(this.predictionIndicators).length === 0;
  }

  private setSpecificDecisionClass(): void {
    switch (this.problemType) {
      case ProblemTypes.Survival:
        this.specificDecisionClass = `tooltips.rules_table.specific_decision_class_${ProblemTypes.Survival}`;
        break;
      case ProblemTypes.Regression:
        this.specificDecisionClass = `tooltips.rules_table.specific_decision_class_${ProblemTypes.Regression}`;
        break;
      default:
        this.specificDecisionClass = `tooltips.rules_table.specific_decision_class_${ProblemTypes.Classification}`;
        break;
    }
  }

  private calculateCoveredByPrediction(indicator: any) {
    if ('Covered_by_prediction' in indicator && 'Not_covered_by_prediction' in indicator) {
      const { Covered_by_prediction, Not_covered_by_prediction } = indicator;
      if (!Covered_by_prediction && !Not_covered_by_prediction) {
        this.predictionPercentage = null;
      }
      this.predictionPercentage = (Covered_by_prediction / (Covered_by_prediction + Not_covered_by_prediction)) * 100;
    }
  }
}
