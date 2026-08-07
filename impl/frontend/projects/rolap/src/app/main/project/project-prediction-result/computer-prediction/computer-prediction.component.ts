import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { EMPTY, Observable, Subject, catchError, filter, map, mergeMap, take, takeUntil } from 'rxjs';

import { faArrowsRotate } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import { V2RulesTableMeta } from 'projects/rolap/src/app/common/store/v2RulesTable/types';
import { getRuleSetWithActive } from 'projects/rolap/src/app/common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from 'projects/rolap/src/app/common/store/v2Tabs/v2Tabs.selectors';

import { NotifyService } from '../../../../common/services/notify/notify.service';
import { RuleSetApiService } from '../../../../common/services/rule-set/rule-set-api.service';
import { Exporter } from '../../../../common/utils/exportUtils';
import { DataUploadComponent } from '../../../data-upload/data-upload.component';
import { FileExtension } from '../../../data-upload/utils/enums';
import { AvailableFileExtensions, DataUploadTypes } from '../../../data-upload/utils/types';
import { getFileName } from '../../../data-upload/utils/utils';
import { DatasetService } from '../../dataset/service/dataset.service';
import { RefreshService } from '../../service/refresh.service';

@Component({
  selector: 'rolap-computer-prediction',
  templateUrl: './computer-prediction.component.html',
  styleUrls: ['./computer-prediction.component.scss'],
})
export class ComputerPredictionComponent implements OnInit, OnDestroy {
  @ViewChild('fileUploader', { static: false }) fileUploader: DataUploadComponent;
  public ids: Ids;
  public dataUploadForm: FormGroup;
  public decimalItems = [',', '.'];
  public encodings = [];
  public extensions: AvailableFileExtensions[] = [FileExtension.csv];
  public faArrowsRotate = faArrowsRotate;
  public isSaving = false;
  public fileInfo: File | null;
  public clearUploader = false;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private fb: FormBuilder,
    private ruleSetApi: RuleSetApiService,
    private refreshService: RefreshService,
    private dataSetService: DatasetService,
    private notify: NotifyService,
    private translate: TranslateService,
    private store: Store<AppState>,
  ) {
    this.store
      .select(selectCurrentV2TabIds)
      .pipe(
        filter((ids) => !!ids),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((ids) => {
        this.ids = ids!;
      });
  }

  ngOnInit() {
    this.dataUploadForm = this.fb.group({
      missingValues: [''],
      encoding: new FormControl(null, [Validators.required]),
      decimal: new FormControl('.'),
      separator: new FormControl(',', [Validators.required]),
    });

    this.setUpEncodings();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onFileInfoValues(fileInfoValues: DataUploadTypes | null): void {
    if (!fileInfoValues) return;
    this.fileInfo = fileInfoValues.file;
  }

  private setUpEncodings() {
    this.dataSetService
      .getAvailableCodecs()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((encodings) => {
        this.encodings = encodings;
        this.dataUploadForm.patchValue({ encoding: this.encodings[0] });
      });
  }

  private getFormControlsValues(): { missingValues: string; encoding: string; decimal: string; separator: string } {
    const missingValues = this.dataUploadForm.get('missingValues')?.value;
    const encoding = this.dataUploadForm.get('encoding')?.value;
    const decimal = this.dataUploadForm.get('decimal')?.value;
    const separator = this.dataUploadForm.get('separator')?.value;

    return { missingValues, encoding, decimal, separator };
  }

  public onPredictButtonClick() {
    this.store
      .select(getRuleSetWithActive)
      .pipe(
        take(1),
        mergeMap((ruleset) => {
          return this.refreshService
            .getGlobalRulesCoverage(this.ids, ruleset)
            .pipe(map((coverage) => [coverage, ruleset]));
        }),
        take(1),
        mergeMap(([coverage, ruleset]) => this.generatePrediction(coverage, ruleset)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((uploadResponse) => this.downloadPredictionFile(uploadResponse));
  }

  private generatePrediction(
    coverage: Record<string, any>,
    ruleset: { meta: V2RulesTableMeta; rules: any[] },
  ): Observable<HttpResponse<Blob>> {
    this.isSaving = true;
    const { decimal, encoding, missingValues, separator } = this.getFormControlsValues();

    const datasetInfo = {
      delimiter: separator,
      decimal_separator: decimal,
      encoding,
      missing_value_sign: missingValues,
    };

    const rulesetInfo = {
      ruleset,
      rule_coverage: coverage,
      original_ruleset_id: this.ids.ruleSetId!,
    };
    return this.ruleSetApi.getPredictionAfterUpload(this.fileInfo!, this.ids.dataSetId!, datasetInfo, rulesetInfo).pipe(
      catchError((err) => {
        this.handleError(err);
        return EMPTY;
      }),
    );
  }

  private downloadPredictionFile(uploadResponse: HttpResponse<Blob>) {
    const name = uploadResponse.headers.get('Content-Disposition');
    Exporter.exportBlobCsv(uploadResponse.body, getFileName(name));
    this.isSaving = false;
    this.notify.showNotify(this.translate.instant('project.prediction.prediction_generate_success'), 'success');
    this.fileInfo = null;
    this.fileUploader.clearFileUploader();
  }

  private handleError(error: HttpErrorResponse) {
    this.isSaving = false;
    throw error;
  }
}
