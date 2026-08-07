import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subject, takeUntil } from 'rxjs';

import { faQuestionCircle } from '@fortawesome/pro-solid-svg-icons';
import { DxTextBoxComponent } from 'devextreme-angular';

import { FieldName } from '../../../../../../../common/components/validation-message/validation-message.component';
import { Modal } from '../../../../../../../common/services/modal/modal';
import { ReportTypes } from '../../../../../../data-upload/utils/enums';
import { CustomReportNameValidation } from '../../../../../../data-upload/utils/formValidators';
import { getLocalDateTime } from '../../../../../../data-upload/utils/utils';
import { GenerateReportResponse } from '../../../../../models/ruleset';
import { DatasetService } from '../../../../service/dataset.service';

@Component({
  selector: 'rolap-explorative-data-analysis',
  templateUrl: './explorative-data-analysis.component.html',
  styleUrls: ['./explorative-data-analysis.component.scss'],
})
export class ExplorativeDataAnalysisComponent implements OnInit, OnDestroy {
  @ViewChild('textBox') textBox: DxTextBoxComponent;

  @Input() dataSetId: number;
  @Input() dataSetName: string;

  public faQuestionCircle = faQuestionCircle;
  public generateReportForm: FormGroup;
  public fieldName = FieldName;
  private $destroy = new Subject<void>();

  constructor(
    private datasetService: DatasetService,
    private modal: Modal<ExplorativeDataAnalysisComponent>,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.generateReportForm = this.fb.group({
      reportName: ['', CustomReportNameValidation],
    });

    this.generateReportForm.controls['reportName'].setValue(
      `${this.dataSetName}_${ReportTypes.EDA}_${getLocalDateTime()}`,
    );
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  public generateReport(): void {
    if (this.generateReportForm.invalid) return;

    this.datasetService
      .generateEdaReport(this.dataSetId, this.generateReportForm.value.reportName)
      .pipe(takeUntil(this.$destroy))
      .subscribe((response: GenerateReportResponse) => {
        this.modal.close(response);
      });
  }

  public onInitialized() {
    // Zastosowano setTimeout przy obszarze focus w kontrolce textBox ze względu na wymagania Devexpress.
    setTimeout(() => {
      this.textBox.instance.focus();
    }, 0);
  }
}
