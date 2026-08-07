import { Component, Input, OnInit, ViewChild } from '@angular/core';

import { filterOutNullish } from '../../../../utils/rxjsUtils';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { ProjectService } from '../../../../../main/project/service/project.service';
import { RulesetCoverageHandler } from '../../../../modules/visualisation/helpers/rulelset_coverage_handler';
import { CoverageRow } from '../../../../modules/visualisation/interfaces/coverage_row';
import { AppState } from '../../../../store/app-state.model';
import { getTypeOfProblem } from '../../../../store/ruleSets/rulesets.selectors';
import { selectCurrentV2RulesTableMeta } from '../../../../store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../../../../store/v2Tabs/v2Tabs.selectors';
import {
  selectCurrentV2VisualizationTabGraphData,
  selectCurrentV2VisualizationTabSelectedGraphNodes,
} from '../../../../store/v2VisualizationTab/v2VisualizationTab.selectors';
import { DataGridComponent } from '../../../../utils/exportUtils';
import { InfoComponentModes } from '../../../info/info.component';

@Component({
  selector: 'rolap-ruleset-visualisation-coverage-info',
  templateUrl: './ruleset-visualisation-coverage-info.component.html',
  styleUrls: ['./ruleset-visualisation-coverage-info.component.scss'],
})
export class RulesetVisualisationCoverageInfoComponent implements DataGridComponent, OnInit {
  public readonly InfoComponentModes = InfoComponentModes;
  public readonly ProblemTypes = ProblemTypes;
  public readonly tabInfo$ = combineLatest([
    this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish()),
    this.store.select(getTypeOfProblem).pipe(filterOutNullish()),
    this.store.select(selectCurrentV2RulesTableMeta).pipe(filterOutNullish()),
  ]).pipe(
    map(([ids, projectType, rulesTableMeta]) => ({
      dataSetId: ids.dataSetId,
      projectType,
      rulesTableMeta,
    })),
  );

  public readonly formattedSelectedConditions$ = this.store
    .select(selectCurrentV2VisualizationTabSelectedGraphNodes)
    .pipe(
      filterOutNullish(),
      map((graphNodes) => {
        return graphNodes
          .map((conditionGroup: any) => conditionGroup.map((condition: any) => condition.text).join(' AND '))
          .join(' AND ');
      }),
    );

  private readonly COLUMNS_TO_SKIP: string[] = ['kaplan_meier_estimator'];

  @ViewChild(DxDataGridComponent) dataGridComponent: DxDataGridComponent;

  public tableData: (CoverageRow | null)[] | { [columnName: string]: any }[] = [];
  public columnNames: string[] = [];
  @Input() isConditionNotCovered: boolean = false;

  public exportCount: number | undefined;

  constructor(private store: Store<AppState>, private projectService: ProjectService) {}

  ngOnInit(): void {
    this.fetchCoverageData();
  }

  private fetchCoverageData(): void {
    combineLatest([
      this.store.select(selectCurrentV2VisualizationTabGraphData).pipe(filterOutNullish()),
      this.store.select(selectCurrentV2VisualizationTabSelectedGraphNodes).pipe(filterOutNullish()),
    ])
      .pipe(
        switchMap(([graphData, selectedGraphNodes]) => {
          if (!graphData || !graphData.dataSetId || !graphData.meta) {
            return of({ data: [], graphData, selectedGraphNodes });
          }
          const conditions: any = selectedGraphNodes.length === 0 ? [[]] : selectedGraphNodes;
          return this.projectService
            .getConditionsCoverage(graphData.dataSetId, {
              meta: graphData.meta,
              conditions,
            })
            .pipe(
              catchError((err) => {
                return of({ data: [], graphData, selectedGraphNodes });
              }),
              map((data) => ({ data, graphData, selectedGraphNodes })),
            );
        }),
      )
      .subscribe(({ data, graphData, selectedGraphNodes }) => {
        this.handleCoverageData(data, graphData, selectedGraphNodes);
      });
  }

  private handleCoverageData(data: any, graphData: any, selectedGraphNodes: any): void {
    if (graphData && graphData.rules) {
      const preparedCoverage = RulesetCoverageHandler.prepareCoverageTable(
        data,
        graphData.meta!,
        graphData.project!.type_of_problem,
      );
      this.tableData = [...preparedCoverage];

      if (this.tableData.length > 0) {
        this.columnNames = Object.keys(this.tableData[0]).filter((column) => !this.COLUMNS_TO_SKIP.includes(column));
      }
    }
  }

  public getTotalCount(): number {
    return this.tableData.length;
  }
  public getDataGrid(): DxDataGridComponent {
    return this.dataGridComponent;
  }
}
