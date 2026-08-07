import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import * as d3 from 'd3';

import { ProjectService } from '../../../../main/project/service/project.service';
import NetworkGraph from '../../../modules/visualisation/graphs/network-graph';

@Component({
  selector: 'rolap-graph-modal',
  templateUrl: './graph-modal.component.html',
  styleUrls: ['./graph-modal.component.scss'],
})
export class GraphModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() rules: any;
  @Input() classDescription: string;
  @Input() datasetId: number;
  @Input() meta: any;

  public selectedConditions = new Map();
  public selectedConditionsKeys = Array.from(this.selectedConditions.keys());
  public formattedSelectedConditions: string = '';
  public classCoverageResult: string[] = [''];

  private ngUnsubcribe: Subject<void> = new Subject();

  constructor(private projectService: ProjectService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    window.addEventListener('resize', this.drawGraph.bind(this));
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawGraph();
    }, 100);
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.ngUnsubcribe.next();
    this.ngUnsubcribe.complete();
    document.body.style.overflow = 'auto';
    window.removeEventListener('resize', this.drawGraph.bind(this));
  }

  private drawGraph(): void {
    const graph = new NetworkGraph(this.rules, null, (condition: any) => {
      if (this.selectedConditions.has(condition.text)) {
        this.selectedConditions.delete(condition.text);
      } else {
        this.selectedConditions.set(condition.text, condition);
      }

      this.selectedConditionsKeys = Array.from(this.selectedConditions.keys());
      this.formattedSelectedConditions = this.selectedConditionsKeys.map((key) => key).join(' AND ');

      this.projectService
        .getConditionsCoverage(this.datasetId, {
          meta: {
            attributes: this.meta?.attributes ?? [],
          },
          conditions: [Array.from(this.selectedConditions.values())],
        })
        .pipe(takeUntil(this.ngUnsubcribe))
        .subscribe((data) => {
          this.classCoverageResult = Object.keys(data[0]).map((key) => `${key}: ${data[0][key]}`);
          this.cdr.detectChanges();
        });
    });

    const drawingArea = d3.select('#graph-area-modal');
    graph.drawGraph(drawingArea, true, true);
  }
}
