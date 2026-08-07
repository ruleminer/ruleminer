import { ChangeDetectorRef, Component, DestroyRef, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Observable, combineLatest, forkJoin, switchMap, take, tap } from 'rxjs';

import { faGridRound, faLineColumns, faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { Modal } from '../../../../../common/services/modal/modal';
import { ModalService } from '../../../../../common/services/modal/modal.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../../../common/store/project/project.selectors';
import { Algorithm, Project } from '../../../models/project';
import { ProcessCreatedResponse } from '../../../models/ruleset';
import { ProcessTabInfoComponent } from '../../../process/process-tab-info/process-tab-info.component';
import { TimerService } from '../../../process/services/timer.service';
import { ProjectService } from '../../../service/project.service';
import { ProjectActions } from '../../../../../common/store/project/project.action';
import { Ids } from '../../../../../common/store/ruleSets/rulesets.selectors';
import { DatasetInfo, AlgorithmConfigChangeEvent, RuleSetGenerationMethods } from './algorithm-configuration/types';
import { ManualGenerationConfigChangeEvent } from './manual-ruleset-generator/types';
import { RulesetNameChangeEvent } from './ruleset-generation-name/types';
import { DatasetInfoService } from './services/dataset-info.service';
import { RulesetGenerationService } from './services/ruleset-generation.service';
import { RulesetManualGenerationService } from './services/ruleset-manual-generation.service';
import { RulesetManualGenerateData, RulesetGenerateForAlgorithmData } from './services/types';

@Component({
  selector: 'rolap-project-generate-rule-set-modal',
  templateUrl: './project-generate-rule-set-modal.component.html',
  styleUrls: ['./project-generate-rule-set-modal.component.scss'],
})
export class ProjectGenerateRuleSetModalComponent implements OnInit {
  @Input() ids: Ids;
  @Input() dataSetName: string;

  public readonly MANUAL_ALGORITHM_NAME = 'Manually';

  public faGridRound = faGridRound;
  public faLineColumns = faLineColumns;
  public faTriangleExclamation = faTriangleExclamation;
  public isValid: boolean = false;
  public rulesetNameFormValid = false;
  public algorithms: Algorithm[];
  public selectedAlgorithm: Algorithm;
  public currentLanguage: string;
  public activeProject: Project;
  public datasetInfo: DatasetInfo;
  private rulesetName: string | null;
  private algorithmConfig: AlgorithmConfigChangeEvent;
  private manualGenerationConfig: ManualGenerationConfigChangeEvent;

  constructor(
    public modal: Modal<ProjectGenerateRuleSetModalComponent>,
    private projectService: ProjectService,
    private datasetInfoService: DatasetInfoService,
    private modalService: ModalService,
    private translateService: TranslateService,
    private rulesetGenerationService: RulesetGenerationService,
    private rulesetManualGenerationService: RulesetManualGenerationService,
    private store: Store<AppState>,
    private timerService: TimerService,
    private changeDetectorRef: ChangeDetectorRef,
    private destroyRef: DestroyRef,
  ) { }

  ngOnInit(): void {
    this.setCustomModalText();
    this.updateCurrentLang();
    this.translateService.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateCurrentLang();
    });
    this.fetchData();
  }

  public onAlgorithmChange($event: Algorithm): void {
    this.selectedAlgorithm = { ...$event };
  }

  public onRulesetNameChange(event: RulesetNameChangeEvent): void {
    this.rulesetName = event.name;
    this.rulesetNameFormValid = event.valid;
    this.updateValidity();
  }

  public onAlgorithmConfigurationChanged(event: AlgorithmConfigChangeEvent): void {
    this.algorithmConfig = event;
    this.updateValidity();
  }

  public onManualRuleGenerationDataChanged(event: ManualGenerationConfigChangeEvent): void {
    this.manualGenerationConfig = event;
    this.updateValidity();
  }

  public onSubmitClick(): void {
    let generationRequest$: Observable<ProcessCreatedResponse>;
    if (this.selectedAlgorithm.name === this.MANUAL_ALGORITHM_NAME) {
      const generationData: RulesetManualGenerateData = {
        ids: this.ids,
        decisionAttributeName: this.datasetInfo.decisionAttributeName,
        rulesetName: this.rulesetName!,
        manuallySelectedIds: this.manualGenerationConfig.manuallySelectedIds,
        selectedManuallyRules: this.manualGenerationConfig.selectedManuallyRules,
        problemType: this.activeProject.type_of_problem,
        datasetInfo: this.datasetInfo,
        predictionConfig: this.manualGenerationConfig.predictionConfig,
      };
      generationRequest$ = this.rulesetManualGenerationService.generateRuleSetManually(generationData);
    } else {
      const generationData: RulesetGenerateForAlgorithmData = {
        ids: this.ids,
        decisionAttributeName: this.datasetInfo.decisionAttributeName,
        rulesetName: this.rulesetName!,
        algorithm: this.selectedAlgorithm,
        generationMethod: this.algorithmConfig.generationMethod,
        algorithmParams: this.algorithmConfig.algorithmParams,
        questionsAnswers: this.algorithmConfig.questionsAnswers,
        expertInduction: this.algorithmConfig.expertInduction,
        crossValidation: this.algorithmConfig.crossValidation,
        predictionConfig: this.algorithmConfig.predictionConfig,
        attributesToSkip: this.algorithmConfig.attributesToSkip,
      };
      generationRequest$ = this.rulesetGenerationService
        .generateRulesetForAlgorithm(generationData)
        .pipe(take(1), takeUntilDestroyed(this.destroyRef));
    }
    generationRequest$.subscribe({
      complete: () => this.handleCreateRulesetComplete(),
    });
  }

  public setShowConfirmModal(shouldShowModal: boolean): void {
    this.modal.showConfirmModal = shouldShowModal;
  }

  private fetchData(): void {
    this.store
      .select(activeProjectSelector)
      .pipe(
        take(1),
        tap((activeProject) => {
          if (!activeProject) throw new Error('No active project');
          this.activeProject = activeProject;
        }),
        switchMap(() => {
          const datasetInfo$ = this.datasetInfoService
            .getDatasetInfo(
              this.ids.projectId!,
              this.ids.dataSetId!,
              this.dataSetName,
              this.activeProject.type_of_problem,
            )
            .pipe(take(1));
          const algorithms$ = this.projectService
            .getAlgorithmsForProblem(this.activeProject.type_of_problem)
            .pipe(take(1));
          const translations$ = forkJoin({
            en: this.translateService.get('project.rules.description'),
            pl: this.translateService.get('project.rules.description'),
            name: this.translateService.get('project.rules.algorithm_name'),
          }).pipe(take(1));
          return combineLatest([datasetInfo$, algorithms$, translations$]).pipe(take(1));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([datasetInfo, algorithms, translations]) => {
        algorithms.push({
          id: algorithms.length + 1,
          problem_type: '',
          name: this.MANUAL_ALGORITHM_NAME,
          version: null,
          na_generation: false,
          expert_induction: false,
          description_pl: translations.pl, // TODO: Algorithms descriptions should be taken from backend (there is a field for them)
          description_en: translations.en, // TODO: Algorithms descriptions should be taken from backend (there is a field for them)
        });
        this.algorithms = algorithms;
        this.datasetInfo = datasetInfo;
        this.selectedAlgorithm = algorithms[0];
      });
  }

  private openProcessListModal(manually = false): void {
    let translateKey = 'process.info_modal.content.';
    translateKey += manually ? 'manually_adding_process_started' : 'generation_process_started';
    this.modalService.open(ProcessTabInfoComponent, 'process.info_modal.title', '400px', undefined, {
      contentTranslateKey: translateKey,
      projectId: this.ids.projectId,
    });
    this.timerService.refresh();
  }

  private handleCreateRulesetComplete(): void {
    this.setShowConfirmModal(false);
    this.modal.close();
    this.openProcessListModal(true);
    this.store.dispatch(ProjectActions.signalTreeDataRefresh())
  }

  private updateCurrentLang(): void {
    this.currentLanguage = this.translateService.currentLang;
  }

  private updateValidity(): void {
    if (!this.rulesetNameFormValid) {
      this.isValid = false;
      return;
    }
    if (this.selectedAlgorithm.name === this.MANUAL_ALGORITHM_NAME) {
      // manual generation
      this.isValid = this.manualGenerationConfig.valid;
    } else if (!this.algorithmConfig) {
      this.isValid = false;
      return;
    } else {
      // generation using algorithm
      if (this.algorithmConfig.generationMethod === RuleSetGenerationMethods.Simple) {
        // simple configuration using questions
        this.isValid = this.algorithmConfig.questionsAnswers?.selectedAnswers?.length > 0;
      } else {
        // advanced configuration
        this.isValid = this.algorithmConfig.formValid;
      }
    }
    this.changeDetectorRef.detectChanges();
  }

  private setCustomModalText(): void {
    this.modal.customConfirmText = 'project.confirm_close_modal.custom_modal_text.rules_generator';
    this.modal.customTitleText = 'project.confirm_close_modal.title.custom_modal_title.rules_generator';
  }
}
