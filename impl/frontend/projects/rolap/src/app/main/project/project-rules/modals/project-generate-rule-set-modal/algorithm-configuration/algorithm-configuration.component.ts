import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { Observable, Subscription, combineLatest, map, merge, of, switchMap, take, tap } from 'rxjs';

import { Store } from '@ngrx/store';
import { ValueChangedEvent } from 'devextreme/ui/radio_group';
import { selectPredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/predictionConfigOptions.selectors';
import { PredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/types';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';

import { FieldName } from '../../../../../../common/components/validation-message/validation-message.component';
import { AppState } from '../../../../../../common/store/app-state.model';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { sortParametersByType } from '../../../../../data-upload/utils/utils';
import { Algorithm, AlgorithmParams, Parameter, Question } from '../../../../models/project';
import {
  DisplayType,
  RulesetPredictionConfigurationComponentData,
} from '../../../../project-description/ruleset-prediction-configuration/types';
import { buildPredictionConfigForm } from '../../../../project-description/ruleset-prediction-configuration/utils';
import { ProjectService } from '../../../../service/project.service';
import { QuestionService } from '../simple-rules-generator/service/question-service.service';
import { ParamsChangeObject } from '../simple-rules-generator/simple-rules-generator.component';
import { AlgorithmConfigChangeEvent, DatasetInfo, RuleSetGenerationMethods } from './types';

@Component({
  selector: 'rolap-algorithm-configuration',
  templateUrl: './algorithm-configuration.component.html',
  styleUrls: ['./algorithm-configuration.component.scss'],
})
export class AlgorithmConfigurationComponent implements OnChanges {
  @Input({ required: true }) ids: Ids;
  @Input({ required: true }) algorithm: Algorithm;
  @Input({ required: true }) currentLanguage: string;
  @Input({ required: true }) datasetInfo: DatasetInfo;
  @Input({ required: true }) problemType: ProblemTypes;
  @Output() onConfigurationChanged = new EventEmitter<AlgorithmConfigChangeEvent>();
  @Output() setShowConfirmModal = new EventEmitter<boolean>();

  private store = inject(Store<AppState>);
  private projectService = inject(ProjectService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private questionService = inject(QuestionService);

  public readonly FieldName = FieldName;
  public readonly RuleSetConfigurations = RuleSetGenerationMethods;
  public loading = false;
  public form: FormGroup;
  public predictionConfigurationFormData: RulesetPredictionConfigurationComponentData;
  public algorithmParams: AlgorithmParams;
  public generationMethod: RuleSetGenerationMethods | null = null;
  public questions: Question[];
  public attributesToSkip: string[] = [];
  public expertInductionParams: { [key: string]: any } | undefined;
  public isSelectedExpertInduction = false;
  private predictionConfigOptions$: Observable<PredictionConfigOptions> = this.store
    .select(selectPredictionConfigOptions)
    .pipe(take(1), filterOutNullish());
  private formValuesChangeSubscription$: Subscription;
  private notAdvancedSurveyAnswers: ParamsChangeObject;
  private crossValidation = false;
  private numFolds = 3;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datasetInfo']) {
      this.attributesToSkip = this.datasetInfo.initialAttributesToSkip;
    }
    if (changes['algorithm']) {
      this.onSelectedAlgorithmChange(this.algorithm);
    }
  }

  /**
   * Called when user submit the filled survey in "not advanced configuration" and we
   * got the new algorithm params values based on the answers.
   *
   * @param {ParamsChangeObject} params
   */
  public onSurveyAnswersChange(event: ParamsChangeObject): void {
    if (event.setShowConfirmModal) this.setShowConfirmModal.emit(true);
    this.notAdvancedSurveyAnswers = event;
    this.emitConfigurationChange();
  }

  /**
   * Called when expert induction parameters change. Note that it is also triggered when
   *  expert induction is disabled or enabled by the user.
   *
   * @param {ParamsChaRecord<string, any> | undefined} expertParamsValues expert induction
   * parameters or undefined if expert induction is disabled.
   */
  public onExpertInductionParamsChange(expertParamsValues: Record<string, any> | undefined): void {
    this.expertInductionParams = expertParamsValues;
    this.isSelectedExpertInduction = expertParamsValues !== undefined;
    this.emitConfigurationChange();
  }

  /**
   * Called when user selects simple or advanced generation configuration
   *
   * @param event event containing the selected generation method
   */
  public onGenerationMethodChange(event: ValueChangedEvent): void {
    this.generationMethod = event.value;
    this.emitConfigurationChange();
  }

  private onSelectedAlgorithmChange(algorithm: Algorithm): void {
    this.loading = true;
    this.algorithm = algorithm;

    const params$ = this.fetchAlgorithmParams(algorithm);
    const questions$ = algorithm.na_generation ? this.fetchAlgorithmQuestions(algorithm) : of([]);

    this.generationMethod = algorithm.na_generation
      ? RuleSetGenerationMethods.Simple
      : RuleSetGenerationMethods.Advanced;

    this.formValuesChangeSubscription$?.unsubscribe();
    this.formValuesChangeSubscription$ = combineLatest([params$, questions$])
      .pipe(
        take(1),
        tap(([params, questions]) => {
          this.algorithmParams = params;
          this.questions = questions;
        }),
        switchMap(() => this.predictionConfigOptions$),
        switchMap((predictionConfigOptions) => this.buildForm(predictionConfigOptions)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.emitConfigurationChange());
  }

  private fetchAlgorithmParams(algorithm: Algorithm): Observable<AlgorithmParams> {
    return this.projectService.getAlgorithmParams(algorithm.id).pipe(
      map((params) => sortParametersByType(this.castParametersDefaultValuesToProperTypes(params))),
      take(1),
    );
  }

  private fetchAlgorithmQuestions(algorithm: Algorithm): Observable<Question[]> {
    return this.projectService.getQuestionForAlgorithm(algorithm.id).pipe(
      map((res) => this.questionService.generateQuestions(res)),
      take(1),
    );
  }

  /**
   * Algorithm parameters default values are stores as strings no matters what is the
   * type of the parameter. This methods maps the default values to the correct type.
   *
   * @param params algorithm parameters
   * @returns algorithm parameters with the correct default values.
   */
  private castParametersDefaultValuesToProperTypes(params: AlgorithmParams): AlgorithmParams {
    function castDefaultValue(param: Parameter): void {
      if (param.parameter_type === 'int') {
        param.default_value = parseInt(param.default_value);
      } else if (param.parameter_type === 'bool') {
        param.default_value = param.default_value === 'False' ? false : true;
      }
    }
    params.parameters.forEach(castDefaultValue);
    params.expert_parameters.forEach(castDefaultValue);
    return params;
  }

  private buildForm(predictionConfigOptions: PredictionConfigOptions): Observable<void> {
    const predictionConfigFormGroup: FormGroup = buildPredictionConfigForm(this.fb, predictionConfigOptions);
    this.predictionConfigurationFormData = {
      formGroup: predictionConfigFormGroup,
      displayType: DisplayType.RuleSetCreation,
    };
    const controlsConfig: { [key: string]: AbstractControl } = {
      crossValidation: this.fb.control(this.crossValidation),
      numFolds: this.fb.control({ value: this.numFolds, disabled: true }),
      predictionConfig: predictionConfigFormGroup,
    };

    const algorithmParamsControls: { [key: string]: AbstractControl } = {};
    for (const param of this.algorithmParams.parameters) {
      algorithmParamsControls[param.name] = this.fb.control(param.default_value);
    }
    const algorithmParamsGroup = new FormGroup(algorithmParamsControls);
    this.form = this.fb.group(controlsConfig);
    this.form.addControl('algorithmParams', algorithmParamsGroup);

    this.loading = false;
    const crossValidationEffect$: Observable<void> = this.form.get('crossValidation')!.valueChanges.pipe(
      tap((v) => {
        // enable/disable numFolds form control when cross validation is enabled/disabled
        v ? this.form.get('numFolds')?.enable() : this.form.get('numFolds')?.disable();
      }),
      takeUntilDestroyed(this.destroyRef),
    );
    this.emitConfigurationChange();
    return merge(crossValidationEffect$, this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)));
  }

  private emitConfigurationChange(): void {
    if (!this.generationMethod) return;
    const event: AlgorithmConfigChangeEvent = {
      generationMethod: this.generationMethod,
      algorithmParams: this.form.get('algorithmParams')?.value,
      questionsAnswers: this.notAdvancedSurveyAnswers,
      expertInduction: {
        enabled: this.isSelectedExpertInduction,
        params: this.expertInductionParams,
      },
      crossValidation: {
        enabled: this.form.get('crossValidation')?.value,
        numFolds: this.form.get('numFolds')?.value,
      },
      predictionConfig: this.form.get('predictionConfig')?.value,
      attributesToSkip: this.attributesToSkip,
      formValid: this.form.valid,
    };
    this.onConfigurationChanged.emit(event);
  }
}
