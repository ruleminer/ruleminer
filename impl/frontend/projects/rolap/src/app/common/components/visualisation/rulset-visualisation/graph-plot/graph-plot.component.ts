import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { filterOutNullish } from '../../../../utils/rxjsUtils';
import {
  BehaviorSubject,
  Subject,
  catchError,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';

import { Store } from '@ngrx/store';
import * as d3 from 'd3';

import { ProblemTypes } from '../../../../../main/data-upload/utils/enums';
import { ProjectService } from '../../../../../main/project/service/project.service';
import NetworkGraph from '../../../../modules/visualisation/graphs/network-graph';
import { RulesetCoverageHandler } from '../../../../modules/visualisation/helpers/rulelset_coverage_handler';
import { AppState } from '../../../../store/app-state.model';
import { selectCurrentV2TabIds } from '../../../../store/v2Tabs/v2Tabs.selectors';
import { SelectedGraphNodes } from '../../../../store/v2VisualizationTab/types';
import { V2VisualizationTabActions } from '../../../../store/v2VisualizationTab/v2VisualizationTab.action';
import {
  selectCurrentV2VisualizationRulesList,
  selectCurrentV2VisualizationTabGraphData,
  selectCurrentV2VisualizationTabSelectedGraphNodes,
} from '../../../../store/v2VisualizationTab/v2VisualizationTab.selectors';

@Component({
  selector: 'rolap-graph-plot',
  templateUrl: './graph-plot.component.html',
  styleUrls: ['./graph-plot.component.scss'],
})
export class GraphPlotComponent implements OnInit, OnDestroy {
  @Input() isConditionNotCovered: boolean;
  @Output() isConditionNotCoveredChange = new EventEmitter<boolean>();
  @Output() dataChange = new EventEmitter<any[]>();

  public classDescription: string = '';
  public showGraph = false;
  public classCoverageResult: string[] = [''];
  private graph: NetworkGraph | undefined;
  private selectedConditions = new Map();

  public graphData: any;
  public data: any[] = [];
  private rulesList: any[] = [];

  public selectedGraphNodes$ = new BehaviorSubject<{
    selectedGraphNodes: SelectedGraphNodes;
    shouldReDraw: boolean;
  } | null>(null);
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>, private projectService: ProjectService) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.store
      .select(selectCurrentV2VisualizationRulesList)
      .pipe(filterOutNullish(), takeUntil(this.ngUnsubscribe))
      .subscribe((rulesList) => {
        this.rulesList = rulesList;
      });
    this.initializeGraphData();
    this.subscribeToGraphUpdates();
  }

  private initializeGraphData(): void {
    this.store
      .select(selectCurrentV2TabIds)
      .pipe(
        filterOutNullish(),
        switchMap(() =>
          this.store.select(selectCurrentV2VisualizationTabSelectedGraphNodes).pipe(filterOutNullish(), take(1)),
        ),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((initialSelectedGraphConditions) => {
        initialSelectedGraphConditions.forEach((conditions: any) => {
          conditions.forEach((condition: any) => {
            this.selectedConditions.forEach((value, key) => {
              if (value.text === condition.text) {
                this.selectedConditions.delete(key);
              }
            });
            this.selectedConditions.set(condition.text, condition);
          });
        });

        this.processDataAndDrawGraph(initialSelectedGraphConditions, true, null);
      });
  }

  private subscribeToGraphUpdates(): void {
    this.store
      .select(selectCurrentV2VisualizationTabGraphData)
      .pipe(
        filterOutNullish(),
        switchMap((graphData) =>
          this.store.select(selectCurrentV2VisualizationRulesList).pipe(
            filterOutNullish(),
            switchMap((rulesList) => {
              return this.store.select(selectCurrentV2VisualizationTabSelectedGraphNodes).pipe(
                filterOutNullish(),
                take(1),
                map((selectedGraphNodes) => ({ rulesList, selectedGraphNodes, graphData })),
                tap((data) => this.filterGraphNodesBySubcondition(data)),
              );
            }),
          ),
        ),
        switchMap((graphData) =>
          this.selectedGraphNodes$.pipe(
            filterOutNullish(),
            distinctUntilChanged(),
            tap(() => this.isConditionNotCoveredChange.emit(false)),
            switchMap((selectedGraphNodesData) => {
              if (!graphData || !graphData.graphData.dataSetId || !graphData.graphData.meta) {
                return of({
                  data: [],
                  graphData,
                  selectedGraphNodes: selectedGraphNodesData.selectedGraphNodes,
                  shouldReDraw: selectedGraphNodesData.shouldReDraw,
                });
              }
              //if nothing on the graph is checked we want to sent [[]] to the backend.
              //We should get send all conditions that are selected on the left
              const rulesFromRulesList = RulesetCoverageHandler.prepareCoverageRules(graphData.rulesList);
              const shouldSendEmpty = rulesFromRulesList.conditions.length === 0;
              const conditions: any = shouldSendEmpty ? [[]] : rulesFromRulesList.conditions;
              return this.projectService
                .getConditionsCoverage(graphData.graphData.dataSetId, {
                  meta: { attributes: graphData.graphData.meta?.attributes ?? [] },
                  conditions,
                })
                .pipe(
                  catchError((err) => {
                    if (err.status === 400) {
                      this.isConditionNotCoveredChange.emit(true);
                    }
                    return of({
                      data: [],
                      graphData,
                      selectedGraphNodes: selectedGraphNodesData.selectedGraphNodes,
                      shouldReDraw: selectedGraphNodesData.shouldReDraw,
                    });
                  }),
                  map((data) => ({
                    data,
                    graphData,
                    selectedGraphNodes: selectedGraphNodesData.selectedGraphNodes,
                    shouldReDraw: selectedGraphNodesData.shouldReDraw,
                  })),
                );
            }),
          ),
        ),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(({ data, graphData, selectedGraphNodes, shouldReDraw }) => {
        this.handleGraphDataUpdate(data, graphData.graphData, selectedGraphNodes, shouldReDraw);
      });
  }

  private filterGraphNodesBySubcondition({ rulesList, selectedGraphNodes }: any): void {
    const checkedSubconditionKeys = new Set(
      rulesList.flatMap((rule: any) =>
        rule.premise.subconditions
          .filter((subcondition: any) => subcondition.checked)
          .map((subcondition: any) => rule.uuid),
      ),
    );

    const updatedGraphNodes = selectedGraphNodes.filter(
      (nodeArray: any) =>
        Array.isArray(nodeArray) && nodeArray.every((node) => checkedSubconditionKeys.has(node.rule_uuid)),
    );

    this.updateSelectedGraphNodes(updatedGraphNodes);
  }

  private updateSelectedGraphNodes(selectedGraphNodes: any, shouldReDraw = true): void {
    this.store.dispatch(V2VisualizationTabActions.setSelectedGraphNodes({ selectedGraphNodes }));
    const validRuleUUIDs = new Set(this.rulesList.map((rule) => rule.uuid));
    const filteredNodes = selectedGraphNodes
      .map((nodeArray: any) => nodeArray.filter((node: any) => validRuleUUIDs.has(node.rule_uuid)))
      .filter((nodeArray: any) => nodeArray.length > 0);
    this.selectedGraphNodes$.next({ selectedGraphNodes: filteredNodes, shouldReDraw });
  }

  private handleGraphDataUpdate(
    data: any[],
    graphData: any,
    selectedGraphNodes: SelectedGraphNodes,
    shouldReDraw: boolean,
  ): void {
    this.data = [];
    if (graphData && graphData.rules) {
      this.data = graphData.data;
      this.graphData = graphData;

      if (!this.isConditionNotCovered) {
        const preparedCoverage = RulesetCoverageHandler.prepareCoverageTable(
          data,
          this.graphData.meta!,
          this.graphData.project!.type_of_problem,
        );
        this.data = [...preparedCoverage];
      }
    }
    this.dataChange.emit(this.data);

    this.processDataAndDrawGraph(selectedGraphNodes, shouldReDraw, data);
  }

  private processDataAndDrawGraph(
    selectedGraphNodes: SelectedGraphNodes,
    shouldReDraw: boolean,
    coverageData: any,
  ): void {
    if (!this.graphData || !this.graphData.rules) {
      return;
    }

    const { rules, conditions } = RulesetCoverageHandler.prepareCoverageRules(this.graphData.rules);
    this.showGraph = !!this.graphData.calculateCoverage && conditions.length > 0;

    if (this.data.length && this.graphData.rules) {
      RulesetCoverageHandler.setCoverages(rules, this.data, this.graphData.project!.type_of_problem, coverageData);
    }

    if (this.graphData.project!.type_of_problem === ProblemTypes.Classification && this.data.length > 0) {
      const classNameArr = this.data.map((x) => x.class_name).filter((x) => !!x);
      this.classDescription = classNameArr ? JSON.stringify(classNameArr) : '';
    }

    this.graphData.data = this.data;

    // Add a check to ensure this.data[0] is defined
    if (this.data.length > 0 && this.data[0]) {
      this.classCoverageResult = Object.keys(this.data[0]).map((key) => `${key}: ${this.data[0][key]}`);
    } else {
      this.classCoverageResult = [];
    }

    if (shouldReDraw) {
      this.createGraph(rules, this.graphData.graphOptions.fullScreen, selectedGraphNodes);
    }
  }

  private createGraph(rules: any, fullScreen: boolean, initialSelectedGraphNodes: SelectedGraphNodes): void {
    this.graph = new NetworkGraph(rules, initialSelectedGraphNodes, (condition: any) => {
      this.toggleCondition(condition);
    });

    if (!fullScreen) {
      setTimeout(() => {
        const drawingArea = d3.select('#graph-area');
        if (this.graph) {
          this.graph.drawGraph(drawingArea, false, true);
        }
      }, 100);
    }
  }

  private toggleCondition(condition: any): void {
    if (this.selectedConditions.has(condition.text)) {
      this.selectedConditions.delete(condition.text);
    } else {
      this.selectedConditions.set(condition.text, condition);
    }

    const selectedGraphNodes = [Array.from(this.selectedConditions.values())] as any;
    if (this.graph) {
      this.graph.selectedGraphNodes = selectedGraphNodes;
    }
    this.updateSelectedGraphNodes(selectedGraphNodes, false);
  }
}
