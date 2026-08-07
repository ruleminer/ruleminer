import { Component, Input, OnDestroy } from '@angular/core';

import { Subject, concatMap, takeUntil } from 'rxjs';

import { Modal } from '../../../../../../common/services/modal/modal';
import { ModalRef } from '../../../../../../common/services/modal/modal-ref';
import { ModalService } from '../../../../../../common/services/modal/modal.service';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { ExplorativeDataAnalysisComponent } from './explorative-data-analysis/explorative-data-analysis.component';
import { KnowledgeDiscoveryComponent } from './knowledge-discovery/knowledge-discovery.component';
import { PredictiveAnalysisComponent } from './predictive-analysis/predictive-analysis.component';

@Component({
  selector: 'rolap-generate-reports',
  templateUrl: './generate-reports.component.html',
  styleUrls: ['./generate-reports.component.scss'],
})
export class GenerateReportsComponent implements OnDestroy {
  @Input() dataSetId: number;
  @Input() name: string;
  @Input() typeOfProblem: ProblemTypes;
  public isSurvival = false;
  private ngUnsubscribe = new Subject<void>();
  constructor(private modalService: ModalService, private modal: Modal<GenerateReportsComponent>) {}

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public handleKnowledgeGeneration() {
    this.modalService
      .open(
        KnowledgeDiscoveryComponent,
        'project.treeview.context_menu.modal.generate_reports.knowledge_discovery_title',
        '70%',
        'auto',
        {
          dataSetId: this.dataSetId,
          typeOfProblem: this.typeOfProblem,
          dataSetName: this.name,
        },
      )
      .pipe(
        takeUntil(this.ngUnsubscribe),
        concatMap((modalRef: ModalRef<ExplorativeDataAnalysisComponent>) => {
          return modalRef.getResult();
        }),
      )
      .subscribe((response: any) => {
        if (response.task_id > 0) this.modal.close(response);
      });
  }

  public handleDataExploration() {
    this.modalService
      .open(
        ExplorativeDataAnalysisComponent,
        'project.treeview.context_menu.modal.generate_reports.explorative_data_analysis_title',
        '70%',
        'auto',
        {
          dataSetId: this.dataSetId,
          dataSetName: this.name,
        },
      )
      .pipe(
        takeUntil(this.ngUnsubscribe),
        concatMap((modalRef: ModalRef<ExplorativeDataAnalysisComponent>) => {
          return modalRef.getResult();
        }),
      )
      .subscribe((response: any) => {
        if (response.task_id > 0) this.modal.close(response);
      });
  }

  public handlePredictiveAnalysis() {
    this.modalService
      .open(
        PredictiveAnalysisComponent,
        'project.treeview.context_menu.modal.generate_reports.predictive_analisys_title',
        '70%',
        'auto',
        {
          dataSetId: this.dataSetId,
          typeOfProblem: this.typeOfProblem,
          dataSetName: this.name,
        },
      )
      .pipe(
        takeUntil(this.ngUnsubscribe),
        concatMap((modalRef: ModalRef<ExplorativeDataAnalysisComponent>) => {
          return modalRef.getResult();
        }),
      )
      .subscribe((response: any) => {
        if (response.task_id > 0) this.modal.close(response);
      });
  }
}
