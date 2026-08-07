import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Observable, Subject, forkJoin, take, takeUntil, tap } from 'rxjs';

import { Store } from '@ngrx/store';
import { PredictionConfigService } from 'projects/rolap/src/app/common/services/prediction-config.service';
import { PredictionConfig } from 'projects/rolap/src/app/common/store/v2DetailsOfRuleSetGeneration/types';

import { FieldName } from '../../../../../../common/components/validation-message/validation-message.component';
import { DictionaryService } from '../../../../../../common/services/dictionary/dictionary.service';
import { Modal } from '../../../../../../common/services/modal/modal';
import { ModalService } from '../../../../../../common/services/modal/modal.service';
import { AppState } from '../../../../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../../../../common/store/project/project.selectors';
import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import {
  CustomDescriptionRuleSetValidation,
  CustomTitleRuleSetValidation,
} from '../../../../../data-upload/utils/formValidators';
import { Project } from '../../../../models/project';
import { ProcessTabInfoComponent } from '../../../../process/process-tab-info/process-tab-info.component';
import { TimerService } from '../../../../process/services/timer.service';
import { FilterRequest, FilterService } from '../../../service/filter.service';

interface FilterForm {
  name: FormControl<string>;
  description: FormControl<string>;
  filter_algorithm: FormControl<string>;
  votingMeasures?: FormControl<string | null>;
  loss: FormControl<number | null>;
}

@Component({
  selector: 'rolap-filter-modal',
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss'],
})
export class FilterModalComponent implements OnInit, OnDestroy {
  @Input() ids: Ids;
  public filterForm: FormGroup<FilterForm>;
  public algorithms = ['coverage', 'forward', 'backward'];
  public FieldName = FieldName;
  public initialized: boolean = false;
  public $votingMeasures = this.dictionaryService.getVotingMeasure();
  private predictionConfig: PredictionConfig;
  public displayVotingMeasures: boolean;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private dictionaryService: DictionaryService,
    private store: Store<AppState>,
    private filterService: FilterService,
    private modalService: ModalService,
    private timerService: TimerService,
    private modal: Modal<FilterModalComponent>,
    private predictionConfigService: PredictionConfigService,
  ) {}

  get isAlgorithmCovered(): boolean {
    const filterAlgorithmValue = this.filterForm.controls['filter_algorithm'].value;
    return filterAlgorithmValue === 'forward' || filterAlgorithmValue === 'backward';
  }

  get votingMeasuresStatus(): string {
    if (!this.filterForm.controls['votingMeasures']) {
      return 'valid';
    }
    const control = this.filterForm.controls['votingMeasures'];
    return control.touched && control.errors ? 'invalid' : 'valid';
  }

  ngOnInit() {
    if (!this.ids.ruleSetId || !this.ids.projectId) throw new Error("Missing ruleSet's or project's id");
    forkJoin([this.getActiveProjectType(), this.getRuleSetPredictionConfig()])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.initialized = true;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  private getActiveProjectType(): Observable<Project> {
    return this.store.select(activeProjectSelector).pipe(
      take(1),
      tap((activeProject) => {
        this.displayVotingMeasures =
          activeProject.type_of_problem === ProblemTypes.Classification ||
          activeProject.type_of_problem === ProblemTypes.Regression;
        this.initForm();
      }),
    );
  }

  private getRuleSetPredictionConfig(): Observable<PredictionConfig> {
    return this.predictionConfigService.getRuleSetPredictionConfig(this.ids.dataSetId!, this.ids.ruleSetId!).pipe(
      take(1),
      tap((predictionConfig) => {
        this.predictionConfig = predictionConfig;
      }),
    );
  }

  private initForm() {
    const formControls: FilterForm = {
      name: new FormControl('', { nonNullable: true, validators: CustomTitleRuleSetValidation })!,
      description: new FormControl('', { nonNullable: true, validators: CustomDescriptionRuleSetValidation }),
      filter_algorithm: new FormControl(this.algorithms[0], { nonNullable: true, validators: [Validators.required] }),
      loss: new FormControl(0, {
        nonNullable: false,
        validators: [Validators.required, Validators.min(0), Validators.max(100)],
      }),
    };

    if (this.displayVotingMeasures) {
      formControls.votingMeasures = new FormControl('', { nonNullable: false, validators: [Validators.required] });
    }

    this.filterForm = new FormGroup<FilterForm>(formControls);
  }

  public filter() {
    const { description, filter_algorithm, loss, name, votingMeasures } = this.filterForm.value;

    const filterRequest: FilterRequest = {
      name: name!,
      description: description!,
      filter_algorithm: filter_algorithm!,
      voting_measure: votingMeasures!,
      prediction_config: this.predictionConfig,
      ...(this.isAlgorithmCovered && { loss: loss! / 100 }),
    };

    this.filterService
      .filterRuleset(this.ids.ruleSetId!, filterRequest)
      .pipe(takeUntil(this.ngUnsubscribe))
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
        projectId: this.ids.projectId,
      },
    );
    this.timerService.refresh();
  }
}
