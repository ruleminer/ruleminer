import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';

import { BehaviorSubject, Subject, of, switchMap, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import * as lodash from 'lodash';
import { setHistogramVisualisationTab } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.action';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';
import { Project } from 'projects/rolap/src/app/main/project/models/project';
import { ProjectService } from 'projects/rolap/src/app/main/project/service/project.service';

import { AppState, PlotData } from '../../../store/app-state.model';
import { getCurentTab } from '../../../store/ruleSets/rulesets.reducer';
import { sidebarWidthSelector } from '../../../store/sidebar/sidebar.reducer';

enum BarPlotTypes {
  attribute_importance = 'attribute_importance',
  condition_importance = 'condition_importance',
}
export interface BarPlotType {
  name: BarPlotTypes;
  attribute_plot_type: boolean;
}

@Component({
  selector: 'rolap-rulset-histogram',
  templateUrl: './rulset-histogram.component.html',
  styleUrls: ['./rulset-histogram.component.scss'],
})
export class RulsetHistogramComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() datasetId: number | undefined;
  @Input() ruleSetId: number | undefined;
  @Input() project: Project;
  @Output() rulsetHistogramLoadingChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  public ProblemTypes = ProblemTypes;
  public BarPlotTypes = BarPlotTypes;
  public dropDownOptions: BarPlotType[] = [
    { name: BarPlotTypes.attribute_importance, attribute_plot_type: true },
    { name: BarPlotTypes.condition_importance, attribute_plot_type: false },
  ];
  public selectedOption: BarPlotType = this.dropDownOptions[0];
  public attribute_importance: PlotData[] = [];
  public condition_importance: PlotData[] = [];
  public attributes_to_plot: PlotData[] = [];
  public conditions_to_plot: PlotData[] = [];
  public attribute_plot_type = true;
  public maxAttributeElements = 10;
  public maxConditionElements = 10;
  public loading$ = new BehaviorSubject<boolean>(true);

  private sidebarWidthSelector = this.store.select(sidebarWidthSelector);
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(private projectService: ProjectService, private store: Store<AppState>) {}

  ngOnInit(): void {
    this.sidebarWidthSelector.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.handleResize();
    }),
      window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngAfterViewInit(): void {
    this.store
      .select(getCurentTab())
      .pipe(
        take(1),
        switchMap((storeData) => {
          if (!!storeData.data.histogramTab && storeData.data.histogramTab.attribute_importance.length > 0) {
            const tabData = storeData.data.histogramTab;
            this.attribute_plot_type = tabData.attribute_plot_type;
            this.selectedOption =
              this.dropDownOptions.find((el) => el.attribute_plot_type == this.attribute_plot_type) ??
              this.dropDownOptions[0];
            this.attribute_importance = lodash.cloneDeep(tabData.attribute_importance);
            this.condition_importance = lodash.cloneDeep(tabData.condition_importance);

            this.maxAttributeElements = tabData.maxAttributeElements ?? 10;
            this.maxConditionElements = tabData.maxConditionElements ?? 10;

            this.attributes_to_plot = this.attribute_importance.filter((el) => el.checked);
            this.conditions_to_plot = this.condition_importance.filter((el) => el.checked);
            setTimeout(() => this.plotData(), 100);
          }

          return of(null);
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => {
        this.loading$.next(true);
        this.projectService.getRulesImportance(this.datasetId ?? 0, this.ruleSetId ?? 0).subscribe((responseData) => {
          if (this.project.type_of_problem === ProblemTypes.Classification) {
            this.attribute_importance = Object.keys(responseData.attribute_importance).map((key) =>
              this.prepareImportanceDataToPlot(responseData.attribute_importance[key], 'attribute', key),
            );
            this.condition_importance = Object.keys(responseData.condition_importance).map((key) =>
              this.prepareImportanceDataToPlot(responseData.condition_importance[key], 'conditions', key),
            );
          } else {
            this.attribute_importance = [
              this.prepareImportanceDataToPlot(responseData.attribute_importance, 'attribute', 'attributes'),
            ];
            this.condition_importance = [
              this.prepareImportanceDataToPlot(responseData.condition_importance, 'conditions', 'conditions'),
            ];
            this.attribute_importance[0].checked = true;
            this.condition_importance[0].checked = true;
            switch (this.selectedOption.name) {
              case BarPlotTypes.attribute_importance:
                this.selectAndPlot(this.attribute_importance[0]);
                break;
              case BarPlotTypes.condition_importance:
                this.selectAndPlot(this.condition_importance[0]);
                break;
            }
          }
          this.updateStore();
          this.loading$.next(false);
          this.rulsetHistogramLoadingChange.emit(false);
        });
      });
  }

  ngOnChanges(): void {
    this.ngAfterViewInit();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  public plotData() {
    let min = Infinity,
      max = -Infinity;
    this.conditions_to_plot = this.condition_importance.filter((el) => el.checked);
    this.attributes_to_plot = this.attribute_importance.filter((el) => el.checked);
    const elements_to_plot = lodash.cloneDeep(
      this.attribute_plot_type ? this.attributes_to_plot : this.conditions_to_plot,
    );
    const maxCount =
      elements_to_plot.length > 0
        ? this.attribute_plot_type
          ? this.maxAttributeElements
          : this.maxConditionElements
        : 0;

    elements_to_plot.forEach((el) => {
      const tempMaxCount = maxCount > el.x.length ? el.x.length : maxCount;
      el.x = el.x.slice(0, tempMaxCount);
      el.y = el.y.slice(0, tempMaxCount);
      const result = this.findMinMax(el, min, max);
      min = result.min;
      max = result.max;
    });

    const layout = {
      responsive: true,
      xaxis: {
        range: min > 0 ? [0, max] : [min, max],
        autosize: true,
        automargin: true,
      },
      yaxis: {
        automargin: true,
        autorange: 'reversed',
      },
      margin: {
        l: 160,
        r: 40,
        b: 80,
        t: 0,
        pad: 20,
      },
    };
    elements_to_plot.forEach((el) => {
      this.plot(el.class, [el], layout);
    });
  }

  public onSelect(event: any) {
    this.selectedOption = event.itemData;
    this.attribute_plot_type = this.selectedOption.attribute_plot_type;
    if (this.attribute_plot_type) {
      this.clearClassificationData();
    } else {
      this.clearAttributeData();
    }

    this.plotData();
    this.updateStore();
  }

  public selectAndPlot(data: PlotData) {
    if (data.data_type == 'attribute') {
      this.attribute_plot_type = true;
      this.clearClassificationData();
    } else {
      this.attribute_plot_type = false;
      this.clearAttributeData();
    }

    this.updateStore();
    setTimeout(() => this.plotData(), 100);
  }

  private sort(y: any[], x: any[], desc = true) {
    const combined = y.map((key, i) => [key, x[i]]);
    combined.sort((a, b) => {
      if (desc) return b[1] - a[1];
      return a[1] - b[1];
    });

    const sortedY = combined.map((item) => item[0]);
    const sortedX = combined.map((item) => item[1]);

    return { sortedY, sortedX };
  }

  private prepareImportanceDataToPlot(data: any, data_type: 'conditions' | 'attribute', className = ''): PlotData {
    const { sortedY, sortedX } = this.sort(Object.keys(data), Object.values(data));
    return {
      x: sortedX,
      y: sortedY,
      class: className,
      type: 'bar',
      checked: false,
      orientation: 'h',
      data_type: data_type,
    };
  }

  private updateStore() {
    this.store.dispatch(
      setHistogramVisualisationTab({
        dataSetId: this.datasetId ?? 0,
        ruleSetId: this.ruleSetId ?? 0,
        projectId: this.project.id ?? 0,
        histogramTab: {
          attribute_importance: lodash.cloneDeep(this.attribute_importance),
          condition_importance: lodash.cloneDeep(this.condition_importance),
          maxAttributeElements: this.maxAttributeElements,
          maxConditionElements: this.maxConditionElements,
          attribute_plot_type: this.attribute_plot_type,
        },
      }),
    );
  }

  private handleResize() {
    this.plotData();
  }

  private findMinMax(data: PlotData, min: number, max: number) {
    const tempMin = Math.min(...data.x);
    const tempMax = Math.max(...data.x);
    return { min: Math.min(min, tempMin), max: Math.max(max, tempMax) };
  }

  private clearClassificationData() {
    if (this.project.type_of_problem !== ProblemTypes.Classification) return;
    this.condition_importance.forEach((el) => (el.checked = false));
    this.conditions_to_plot = [];
  }

  private clearAttributeData() {
    if (this.project.type_of_problem !== ProblemTypes.Classification) return;
    this.attributes_to_plot = [];
    this.attribute_importance.forEach((el) => (el.checked = false));
  }

  private plot(className: string, data: any, layout: any) {
    setTimeout(() => {
      const element = document.getElementById(`histogram-area-${className}`);
      if (element)
        (window as any).Plotly.newPlot(element, data, layout, {
          responsive: true,
        });
    }, 100);
  }
}
