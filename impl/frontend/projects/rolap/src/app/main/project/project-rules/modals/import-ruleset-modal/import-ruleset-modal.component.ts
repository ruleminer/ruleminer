import { Component, DestroyRef, Input, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { combineLatest, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { DictionaryService } from 'projects/rolap/src/app/common/services/dictionary/dictionary.service';
import { Modal } from 'projects/rolap/src/app/common/services/modal/modal';
import { ModalService } from 'projects/rolap/src/app/common/services/modal/modal.service';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { selectPredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/predictionConfigOptions.selectors';
import { PredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/types';
import { activeProjectSelector } from 'projects/rolap/src/app/common/store/project/project.selectors';

import { FieldName } from '../../../../../common/components/validation-message/validation-message.component';
import { FileExtension, ProblemTypes } from '../../../../data-upload/utils/enums';
import {
  CustomDescriptionDatasetValidation,
  CustomTitleDatasetValidation,
} from '../../../../data-upload/utils/formValidators';
import { AvailableFileExtensions, DataUploadTypes } from '../../../../data-upload/utils/types';
import { checkFileExtension } from '../../../../data-upload/utils/utils';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { RulesetImport } from '../../../models/ruleset';
import { ProcessTabInfoComponent } from '../../../process/process-tab-info/process-tab-info.component';
import { TimerService } from '../../../process/services/timer.service';
import {
  DisplayType,
  RulesetPredictionConfigurationComponentData,
} from '../../../project-description/ruleset-prediction-configuration/types';
import { buildPredictionConfigForm } from '../../../project-description/ruleset-prediction-configuration/utils';

@Component({
  selector: 'rolap-import-ruleset-modal',
  templateUrl: './import-ruleset-modal.component.html',
  styleUrls: ['./import-ruleset-modal.component.scss'],
})
export class ImportRulesetModalComponent implements OnInit {
  @Input() dataSetId: number;
  @Input() projectId: number;

  public form: FormGroup = this.fb.group({
    rulesetName: ['', CustomTitleDatasetValidation],
    rulesetDescription: ['', CustomDescriptionDatasetValidation],
    predictionConfig: this.fb.group({}),
    algorithm: ['', Validators.required],
  });
  public extensions: AvailableFileExtensions[] = [FileExtension.json, FileExtension.txt];
  public isFileValid: boolean;
  public fileToImport: File;
  public displayVotingMeasures: boolean;
  public $votingMeasures = this.dictionaryService.getVotingMeasure();
  public FieldName = FieldName;
  public predictionConfigComponentData: RulesetPredictionConfigurationComponentData;
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private modalService: ModalService,
    private timerService: TimerService,
    private modal: Modal<ImportRulesetModalComponent>,
    private dictionaryService: DictionaryService,
    private datasetService: DatasetService,
    private store: Store<AppState>,
    private translateService: TranslateService,
  ) {}

  private onLangChangeSignal = toSignal(this.translateService.onLangChange);
  private getCurrentTranslation = computed(() => {
    this.onLangChangeSignal();
    const lang = this.onLangChangeSignal()?.lang;
    if (!lang) return this.translateService.currentLang;
    return lang;
  });

  public link = computed(() => {
    const currentLang = this.getCurrentTranslation();
    return currentLang === 'pl'
      ? 'https://ruleminer.ai/wp-content/uploads/2025/01/Dokumentacja-PL2.pdf#page=112&zoom=100,125,472'
      : 'https://github.com/ruleminer/ruleminer/wiki/13-Import-ruleset';
  });

  ngOnInit(): void {
    this.getActiveProjectType();
  }

  public onFileInfoValues(fileInfoValues: DataUploadTypes | null): void {
    if (!fileInfoValues?.file) return;

    this.isFileValid = checkFileExtension(fileInfoValues.file, this.extensions);

    if (!this.isFileValid) return;

    this.fileToImport = fileInfoValues.file;
  }

  public import() {
    const formData: RulesetImport = {
      name: this.form.value.rulesetName,
      description: this.form.value.rulesetDescription,
      prediction_config: this.form.value.predictionConfig,
      external_algorithm_name: this.form.value.algorithm,
    };

    this.datasetService
      .importRuleset(this.dataSetId, this.fileToImport, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.handleRuleSetImport();
        this.modal.close();
      });
  }

  private handleRuleSetImport() {
    this.modalService.open(
      ProcessTabInfoComponent,
      'process.info_modal.content.saving_process_started',
      '400px',
      undefined,
      {
        projectId: this.projectId,
      },
    );
    this.timerService.refresh();
  }

  private initForm(predictionConfigOptions: PredictionConfigOptions) {
    const predictionConfigForm: FormGroup = buildPredictionConfigForm(this.fb, predictionConfigOptions);
    this.predictionConfigComponentData = {
      displayType: DisplayType.RuleSetImport,
      formGroup: predictionConfigForm,
    };

    this.form.setControl('predictionConfig', predictionConfigForm);

    if (this.displayVotingMeasures) {
      Object.keys(predictionConfigForm.controls).forEach((key) => {
        this.form.addControl(key, predictionConfigForm.get(key));
      });
    }
  }

  private getActiveProjectType() {
    combineLatest([
      this.store.select(selectPredictionConfigOptions).pipe(filterOutNullish(), take(1)),
      this.store.select(activeProjectSelector).pipe(filterOutNullish(), take(1)),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([predictionConfigOptions, activeProject]) => {
        this.displayVotingMeasures =
          activeProject.type_of_problem === ProblemTypes.Classification ||
          activeProject.type_of_problem === ProblemTypes.Regression;
        this.initForm(predictionConfigOptions);
      });
  }
}
