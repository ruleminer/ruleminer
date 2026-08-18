import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { DxTextBoxComponent } from 'devextreme-angular';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { Modal } from '../../../../../../../common/services/modal/modal';
import { ReportTypes } from '../../../../../../data-upload/utils/enums';
import { CustomReportNameValidation } from '../../../../../../data-upload/utils/formValidators';
import { getLocalDateTime } from '../../../../../../data-upload/utils/utils';
import { GenerateReportResponse } from '../../../../../models/ruleset';
import { DatasetService } from '../../../../service/dataset.service';
import { titleSection } from '../const';
import { ReportFormData, ReportFormMeta } from '../report-form/report-form-meta';
import { buildReportFormSchema } from '../report-form/utils';
import { KnowledgeDiscoveryRequest } from './knowledge-discovery-request';

@Component({
  selector: 'rolap-knowledge-discovery',
  templateUrl: './knowledge-discovery.component.html',
  styleUrls: ['./knowledge-discovery.component.scss'],
})
export class KnowledgeDiscoveryComponent implements OnInit, OnDestroy {
  @ViewChild('textBox') textBox: DxTextBoxComponent;
  @Input() dataSetId: number;
  @Input() dataSetName: string;

  public readonly ProblemTypes = ProblemTypes;
  public reportFormData: ReportFormData;

  private ngUnsubscribe = new Subject<void>();

  constructor(private datasetService: DatasetService, private modal: Modal<KnowledgeDiscoveryComponent>) {}

  ngOnInit(): void {
    this.loadReportSchema();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public loadReportSchema(): void {
    this.datasetService
      .getReportSchema(this.dataSetId, ReportTypes.KD)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((schema: ReportFormMeta[]) => {
        const knowledgeDiscoveryForm = buildReportFormSchema(schema);
        knowledgeDiscoveryForm.controls[titleSection].setValue(
          `${this.dataSetName}_${ReportTypes.KD}_${getLocalDateTime()}`,
        );
        knowledgeDiscoveryForm.controls[titleSection].addValidators(CustomReportNameValidation);
        this.reportFormData = {
          formMeta: schema,
          reportFormGroup: knowledgeDiscoveryForm,
        };
      });
  }

  public generateReport(): void {
    const request = this.reportFormData.reportFormGroup.value as KnowledgeDiscoveryRequest;
    this.datasetService
      .generateDiscoveryReport(this.dataSetId, request)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response: GenerateReportResponse) => {
        this.modal.close(response);
      });
  }
}
