import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { DxTextBoxComponent } from 'devextreme-angular';
import { ProblemTypes, ReportTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { Modal } from '../../../../../../../common/services/modal/modal';
import { CustomReportNameValidation } from '../../../../../../data-upload/utils/formValidators';
import { getLocalDateTime } from '../../../../../../data-upload/utils/utils';
import { GenerateReportResponse } from '../../../../../models/ruleset';
import { DatasetService } from '../../../../service/dataset.service';
import { AnalysisMode, analysisModeSection, predictionSettingsSection, testSizeSection, titleSection } from '../const';
import { ReportFormData, ReportFormMeta } from '../report-form/report-form-meta';
import { buildReportFormSchema } from '../report-form/utils';
import { PredictiveAnalysisRequest } from './predictive-analysis-request';

@Component({
  selector: 'rolap-predictive-analysis',
  templateUrl: './predictive-analysis.component.html',
  styleUrls: ['./predictive-analysis.component.scss'],
})
export class PredictiveAnalysisComponent implements OnInit, OnDestroy {
  @ViewChild('textBox') textBox: DxTextBoxComponent;
  @Input() dataSetId: number;
  @Input() dataSetName: string;

  public readonly ProblemTypes = ProblemTypes;
  public reportFormData: ReportFormData;

  private ngUnsubscribe = new Subject<void>();

  constructor(private datasetService: DatasetService, private modal: Modal<PredictiveAnalysisComponent>) {}

  ngOnInit(): void {
    this.loadReportSchema();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public loadReportSchema(): void {
    this.datasetService
      .getReportSchema(this.dataSetId, ReportTypes.PA)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((schema: ReportFormMeta[]) => {
        const predictiveAnalysisForm = buildReportFormSchema(schema);
        predictiveAnalysisForm.controls[titleSection].setValue(
          `${this.dataSetName}_${ReportTypes.PA}_${getLocalDateTime()}`,
        );
        predictiveAnalysisForm.controls[titleSection].addValidators(CustomReportNameValidation);
        predictiveAnalysisForm
          .get(predictionSettingsSection)!
          .get(analysisModeSection)!
          .valueChanges.subscribe(() => this.switchAnalysisMode());

        this.reportFormData = {
          formMeta: schema,
          reportFormGroup: predictiveAnalysisForm,
        };
      });
  }

  public generateReport(): void {
    const request = this.reportFormData.reportFormGroup.value as PredictiveAnalysisRequest;
    this.datasetService
      .generatePredictionReport(this.dataSetId, request)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response: GenerateReportResponse) => {
        this.modal.close(response);
      });
  }

  public switchAnalysisMode() {
    const analysisMode = this.reportFormData.reportFormGroup.get(predictionSettingsSection)!.get(analysisModeSection)!;
    const testSize = this.reportFormData.reportFormGroup.get(predictionSettingsSection)!.get(testSizeSection)!;
    if (analysisMode.value === AnalysisMode.TRAIN_TEST) {
      testSize.enable();
    } else {
      testSize.disable();
    }
  }
}
