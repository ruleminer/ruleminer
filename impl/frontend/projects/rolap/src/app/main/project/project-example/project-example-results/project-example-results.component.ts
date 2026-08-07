import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Observable, debounceTime, distinctUntilChanged, map } from 'rxjs';

import { Store } from '@ngrx/store';
import { isEqual } from 'lodash';

import { AppState, SubTabsNames } from '../../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../../common/store/project/project.selectors';
import {
  selectClassifyAndFirstTimeLoading,
  selectProjectExampleResults,
} from '../../../../common/store/v2Classify/v2Classify.selectors';
import { ProblemTypes } from '../../../data-upload/utils/enums';
import { ProjectRulesTableData } from '../../project-rules/project-rules-table/models/rules-table';
import { RulesTableSettingsService } from '../../project-rules/project-rules-table/service/rules-table-settings.service';
import { ClassifyService } from '../classify.service';

@Component({
  selector: 'rolap-project-example-results',
  templateUrl: './project-example-results.component.html',
  styleUrls: ['./project-example-results.component.scss'],
})
export class ProjectExampleResultsComponent implements OnChanges {
  @Input({ required: true }) cardKey: string;
  @Input({ required: true }) exampleIndex: number;

  public projectRulesTableData: ProjectRulesTableData | null;

  private store = inject(Store<AppState>);
  private rulesTableSettingsService = inject(RulesTableSettingsService);
  private classifyService = inject(ClassifyService);

  private labelAttribute = this.classifyService.labelAttribute;

  public projectRulesTableData$: Observable<ProjectRulesTableData | null>;

  public showNeedsRecalculationInfo$ = this.store.select(selectProjectExampleResults).pipe(
    filterOutNullish(),
    map(({ classifyCards }) => {
      const currentExample = classifyCards.find((card) => card.id === this.cardKey);
      if (!currentExample?.exampleResult) return false;
      return currentExample?.showNeedsRecalculationInfo || false;
    }),
  );

  public decision$ = this.store.select(selectProjectExampleResults).pipe(
    filterOutNullish(),
    map(({ classifyCards }) => {
      const currentExample = classifyCards.find((card) => card.id === this.cardKey);
      if (!currentExample?.exampleResult) return null;
      return currentExample?.exampleResult?.decision || null;
    }),
  );

  public decisionVariable$ = this.store.select(selectClassifyAndFirstTimeLoading).pipe(
    filterOutNullish(),
    map((classify) => classify.cards.find((card) => card.id === this.cardKey)),
    map((card) => card?.exampleTable),
    map((data) => {
      const labelAttribute = this.labelAttribute();
      const isTypeOfProblemNotSurvival = this.projectRulesTableData?.typeOfProblem !== ProblemTypes.Survival;
      if (!labelAttribute || !data || !isTypeOfProblemNotSurvival) return null;
      return data[0][labelAttribute];
    }),
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cardKey']) this.setup();
  }

  public exampleHasResult$ = this.store.select(selectProjectExampleResults).pipe(
    filterOutNullish(),
    map((data) => {
      const currentExample = data.classifyCards.find((card) => card.id === this.cardKey);
      if (!currentExample) return false;

      const rulesTableData = currentExample.exampleResult?.resultTableData || [];
      return rulesTableData.length !== 0;
    }),
  );

  public noRulesCoveringExample$ = this.exampleHasResult$.pipe(map((hasResult) => !hasResult));

  public problemType$ = this.store.select(activeProjectSelector).pipe(map((project) => project?.type_of_problem));

  private setup(): void {
    this.projectRulesTableData$ = this.store.select(selectProjectExampleResults).pipe(
      filterOutNullish(),
      debounceTime(100),
      map(({ classifyCards, projectRulesTableData }) => {
        const currentExample = classifyCards.find((card) => card.id === this.cardKey);
        if (!currentExample) throw new Error('currentExample should be defined');
        const exampleResult = currentExample?.exampleResult;
        return {
          projectRulesTableData,
          exampleResult,
        };
      }),
      distinctUntilChanged((prev, curr) =>
        isEqual(prev.exampleResult?.resultTableData, curr.exampleResult?.resultTableData),
      ),
      map(({ projectRulesTableData, exampleResult }) => {
        if (!exampleResult) {
          return null;
        }
        return {
          ...projectRulesTableData,
          v2RulesTableData: exampleResult.resultTableData,
          displayType: SubTabsNames.EXAMPLE,
          selectMultiple: false,
          settings: this.rulesTableSettingsService.getAllProjectRulesTableSettings(SubTabsNames.EXAMPLE),
        };
      }),
    );
  }
}
