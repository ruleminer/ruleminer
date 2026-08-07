import {
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnInit,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import { forkJoin, map, mergeMap, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { GroupOperation } from 'devextreme/ui/filter_builder';
import { isArray, isEqual } from 'lodash';
import {
  selectCurrentAttributes,
  selectCurrentAttributesMinMaxValues,
} from 'projects/rolap/src/app/common/store/attributes/attributes.selectors';
import { makeDisplayConclusionValue } from 'projects/rolap/src/app/common/store/v2RulesTable/utils';

import { Modal } from '../../../../../common/services/modal/modal';
import { AppState } from '../../../../../common/store/app-state.model';
import { activeProjectProblemTypeSelector } from '../../../../../common/store/project/project.selectors';
import { removeIfAndThenFromRule } from '../../../../../common/store/ruleSets/rulesets.reducer';
import { ProblemTypes } from '../../../../data-upload/utils/enums';
import { convertRulesBigTableRowForBackend, replaceAttributeValueByIndex } from '../../../../data-upload/utils/utils';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { EditedRow } from '../../../models/ruleset';
import { DataField } from '../../../service/models/rules-customize-columns-api';
import { RulesEditorService } from '../../../service/rules-editor.service';
import { RuleMetricEntry } from './rules-editor-metrics/models';
import { EDITOR_STATE_SERVICE_TOKEN, editorStateServiceProvider } from './service/editor-state/editor-state.provider';
import { RulesTableEditorHistoryService } from './service/rules-table-editor-history.service';
import { ConditionsCheckboxesModel, ConditionsCheckboxesTypes } from './types/conditions-checkboxes';
import {
  ExpertRule,
  RulesEditorConfig,
  RulesEditorDisplayTypes,
  RulesTableEditorModalSettings,
  Subcondition,
} from './types/rules-editor';

@Component({
  selector: 'rolap-project-rules-table-editor',
  providers: [RulesTableEditorHistoryService, RulesEditorService, editorStateServiceProvider],
  templateUrl: './project-rules-table-editor.component.html',
  styleUrls: ['./project-rules-table-editor.component.scss'],
})
export class ProjectRulesTableEditorComponent implements OnInit {
  @ViewChild('filterBuilder', { read: ElementRef }) filterBuilder: ElementRef<any>;
  @Input({ required: true }) readonly MODAL_SETTINGS!: Readonly<RulesTableEditorModalSettings>;
  public editorStateService = inject(EDITOR_STATE_SERVICE_TOKEN, { host: true });

  public problemTypeSignal = toSignal(this.store.select(activeProjectProblemTypeSelector).pipe(filterOutNullish()));
  public isClassification = computed(() => this.problemTypeSignal() === ProblemTypes.Classification);

  public configSignal: Signal<RulesEditorConfig | null> = this.editorStateService.configSignal;
  private preferredConditionCountSignal = this.editorStateService.preferredConditionCountSignal;
  private allAttributesSignal = this.editorStateService.allAttributesSig;
  private allAttributesNamesSignal = this.editorStateService.allAttributesNamesSignal;
  private allAttributes: any;
  public subconditionsSignal = this.editorStateService.subconditionsSignal;
  public fields: any[];
  public ruleObjectSignal = this.editorStateService.ruleSig;
  public groupOperations: GroupOperation[] = ['and'];
  public conditionsFlags: ConditionsCheckboxesModel = {
    [ConditionsCheckboxesTypes.refine]: [],
    [ConditionsCheckboxesTypes.determine]: [],
  };
  public conditionsCheckboxesModel: ConditionsCheckboxesModel | null = null;
  public coverageSignal = this.editorStateService.coverage;
  public attributesMinMaxValues: Record<string, { min: number; max: number }>;
  public ruleMetrics: RuleMetricEntry[] | null = null;

  private valueChangedInitialized = false;

  private destroyRef = inject(DestroyRef);

  private readonly FIELDS_THAT_SHOULD_NOT_BE_CLEANED_AFTER_EDITION: DataField.Labels[] = [DataField.Labels];
  public readonly MAX_GROUP_LEVEL = 3;

  constructor(
    private datasetService: DatasetService,
    private modal: Modal<ProjectRulesTableEditorComponent>,
    private rulesEditorService: RulesEditorService,
    private store: Store<AppState>,
  ) {
    effect(
      () => {
        const config = this.configSignal();
        if (!config) return;
        const isCalledForExistingRuleSet = this.MODAL_SETTINGS.ids.ruleSetId !== undefined;

        const datasetAttributes$ = isCalledForExistingRuleSet
          ? this.store.select(selectCurrentAttributes).pipe(take(1))
          : this.datasetService.getAttributesForDataset(this.MODAL_SETTINGS.ids.dataSetId!);

        const attributesMinMaxValues$ = isCalledForExistingRuleSet
          ? this.store.select(selectCurrentAttributesMinMaxValues).pipe(take(1))
          : this.datasetService.getAttributesMinMaxValues(this.MODAL_SETTINGS.ids.dataSetId!);

        return forkJoin({
          attributes: datasetAttributes$,
          attributesMinMaxValues: attributesMinMaxValues$,
        })
          .pipe(
            mergeMap(({ attributes, attributesMinMaxValues }) => {
              this.attributesMinMaxValues = attributesMinMaxValues!;
              const datasetAttributes = this.rulesEditorService.splitDataByRole(attributes!);
              this.allAttributes = datasetAttributes.attrs;
              this.editorStateService.setAllAttributes(datasetAttributes.attrs);

              return this.datasetService
                .getNominalAttributes(this.MODAL_SETTINGS.ids.dataSetId!)
                .pipe(map((nominalAttr) => ({ nominalAttr, datasetAttributes })));
            }),

            map(({ nominalAttr, datasetAttributes }) => {
              const crossReferencedAttributes = this.editorStateService.getCrossReferencedAttributes(nominalAttr);
              this.editorStateService.setNominalAttributes(nominalAttr);
              this.fields = this.rulesEditorService.initializeFields(
                datasetAttributes.attrs,
                nominalAttr,
                crossReferencedAttributes,
                this.MODAL_SETTINGS.displayType,
              );

              return;
            }),
            take(1),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(() => {
            if (config.isEdit && this.MODAL_SETTINGS.selectedRow) {
              const processCondition = this.rulesEditorService.updateSubconditionAttributes(
                this.MODAL_SETTINGS.selectedRow.premise,
                this.allAttributes,
              );
              this.editorStateService.setsubconditionsSignal(processCondition);
            } else {
              this.editorStateService.setsubconditionsSignal([]);
            }
          });
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const isUserEditedSignal = this.editorStateService.isTouched();
        if (isUserEditedSignal) {
          this.setShowConfirmModalOnClose(true);
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {
    this.editorStateService.setModalSettings(this.MODAL_SETTINGS);
    const conclusionFromTable = this.MODAL_SETTINGS.selectedRow?.conclusion;
    if (conclusionFromTable) this.editorStateService.setConclusionSignal(conclusionFromTable);
    this.modal.showConfirmModalOnClose = false;
  }

  public structuredFilterChange(value: Subcondition[]): void {
    if (value === undefined) return;
    if (this.valueChangedInitialized) {
      this.setShowConfirmModal(true);
    }

    if (!value || value.length === 0) {
      this.valueChangedInitialized = true;
      return;
    } else {
      this.editorStateService.setlistValueObjectSignal(value);
      this.editorStateService.setsubconditionsSignal(value);
      this.valueChangedInitialized = true;
    }
  }

  public cancel() {
    this.setShowConfirmModal(false);
    this.modal.close();
  }

  public submit(): void {
    this.setShowConfirmModal(false);
    this.saveAddedOrEditedRule();
  }

  private saveAddedOrEditedRule(): void {
    const problemType = this.problemTypeSignal();
    const config = this.configSignal();
    const conclusion = this.editorStateService.editorConclusionState();
    const displayType = this.MODAL_SETTINGS.displayType;
    const ruleString = this.editorStateService.actualRuleString();

    if (!problemType || !config || !conclusion || !ruleString) return;

    if (config?.isEdit && !this.wasRuleChanged()) return this.handleUnchangedRuleSubmit();

    const ruleTableRow: Record<DataField, any> = {
      ...(this.ruleObjectSignal() as any),
      string: ruleString,
      displayString: removeIfAndThenFromRule(ruleString),
      displayConclusion: makeDisplayConclusionValue(problemType, conclusion as any),
      active: true,
    };
    const isArrayPremise = isArray(ruleTableRow.premise);
    ruleTableRow.premise =
      isArrayPremise && ruleTableRow.premise.length === 1 ? ruleTableRow.premise[0] : ruleTableRow.premise;

    if (problemType === 'survival') {
      const kaplanMeierEstimator =
        (this.editorStateService.editorConclusionState() as any)[0].kaplan_meier_estimator || {};
      ruleTableRow['kaplanMeierEstimator'] = kaplanMeierEstimator;
    }

    this.updateTableRowMetrics(ruleTableRow, this.editorStateService.rawRuleMetrics());

    const displayTypeHandlers = new Map<RulesEditorDisplayTypes, (ruleTableRow: Record<DataField, any>) => void>([
      [RulesEditorDisplayTypes.RULE_EDITING, this.ruleEditingSubmit.bind(this)],
      [RulesEditorDisplayTypes.RULE_EDITING_NOT_COVERED, this.ruleEditingSubmit.bind(this)],
      [RulesEditorDisplayTypes.EXPERT_RULES, this.expertRulesSubmit.bind(this)],
      [RulesEditorDisplayTypes.EXPERT_PREFERRED_CONDITIONS, this.expertConditionSubmit.bind(this)],
      [RulesEditorDisplayTypes.EXPERT_FORBIDDEN_CONDITIONS, this.expertConditionSubmit.bind(this)],
      [RulesEditorDisplayTypes.RULE_ADDING_STORE, this.ruleAddingSubmit.bind(this)],
      [RulesEditorDisplayTypes.RULE_ADDING_BACKEND, this.ruleAddingSubmit.bind(this)],
    ]);
    const handler = displayTypeHandlers.get(displayType);
    if (!handler) throw new Error('Invalid component configuration');
    handler(ruleTableRow);
  }

  private updateTableRowMetrics(ruleTableRow: Record<DataField, any>, ruleMetrics: RuleMetricEntry[]) {
    ruleMetrics?.forEach((metric) => {
      ruleTableRow[metric.name as DataField] = metric.value;
    });
  }

  private ruleEditingSubmit(ruleTableRow: Record<DataField, any>) {
    if (this.MODAL_SETTINGS.selectedRow === undefined) throw Error('selected row should be defined');
    Object.keys(this.MODAL_SETTINGS.selectedRow)
      .filter((key) => !(key in ruleTableRow))
      .forEach((key) => {
        ruleTableRow[key as DataField] = null;
      });
    this.FIELDS_THAT_SHOULD_NOT_BE_CLEANED_AFTER_EDITION.forEach((key: DataField) => {
      ruleTableRow[key] = this.MODAL_SETTINGS.selectedRow![key];
    });
    ruleTableRow[DataField.AutoIncrement] = this.MODAL_SETTINGS.autoIncrement;
    this.modal.close({ ruleTableRow });
  }

  private ruleAddingSubmit(ruleTableRow: EditedRow) {
    const attr = this.allAttributesSignal();
    if (!attr) return;
    this.modal.close({
      ruleTableRow,
      attr,
      decisionName: this.MODAL_SETTINGS.decisionAttributeName,
    });
  }

  private expertRulesSubmit(ruleTableRow: EditedRow) {
    const attributeNames = this.allAttributesNamesSignal();
    if (!attributeNames) return;
    let mappedRuleTableRow: ExpertRule = convertRulesBigTableRowForBackend(ruleTableRow) as ExpertRule;
    mappedRuleTableRow = replaceAttributeValueByIndex(mappedRuleTableRow, attributeNames);
    mappedRuleTableRow.premise.subconditions.forEach((subcondition: any, i: number) => {
      Object.keys(ConditionsCheckboxesTypes).forEach((key: string) => {
        const conditionType = key as ConditionsCheckboxesTypes;
        subcondition[conditionType] = this.conditionsFlags[conditionType][i];
      });
    });
    this.modal.close({ ruleTableRow: mappedRuleTableRow, class: null });
  }

  private expertConditionSubmit(ruleTableRow: EditedRow) {
    const problemType = this.problemTypeSignal();
    const config = this.configSignal();
    const preferredConditionCount = this.preferredConditionCountSignal();
    if (!problemType || !config) return;

    let mappedRuleTableRow: ExpertRule = convertRulesBigTableRowForBackend(ruleTableRow) as ExpertRule;
    const attributeNames = this.allAttributesNamesSignal();
    if (!attributeNames) return;
    mappedRuleTableRow = replaceAttributeValueByIndex(mappedRuleTableRow, attributeNames);
    if (!config.isForbidden) {
      mappedRuleTableRow.premise.number = preferredConditionCount ? preferredConditionCount : 'inf';
    }

    let currentClass: Array<string | number> = [];
    if (Array.isArray(ruleTableRow.conclusion)) {
      currentClass = (ruleTableRow.conclusion as Array<{ value: string | number }>).map((obj) => obj?.value);
    } else if (ruleTableRow.conclusion != null) {
      const single = ruleTableRow.conclusion as { value?: string | number };
      if (single && typeof single === 'object' && 'value' in single && single.value !== undefined) {
        currentClass = [single.value];
      } else {
        console.warn('[RulesEditor] Classification expects conclusion as array, got:', ruleTableRow.conclusion);
      }
    }

    this.modal.close({ ruleTableRow: mappedRuleTableRow, class: currentClass });
  }

  private handleUnchangedRuleSubmit() {
    const ruleSig = this.ruleObjectSignal();
    if (!ruleSig) return;
    const ruleTableRow = {
      ...this.MODAL_SETTINGS.selectedRow,
      ...ruleSig,
    };
    this.modal.close({ ruleTableRow });
  }

  private wasRuleChanged() {
    if (!this.MODAL_SETTINGS.selectedRow) return;
    const wasPremiseChanged = !isEqual(this.MODAL_SETTINGS.selectedRow.premise, this.ruleObjectSignal()?.premise);
    const wasConclusionChanged = !isEqual(
      this.MODAL_SETTINGS.selectedRow.conclusion,
      this.ruleObjectSignal()?.conclusion,
    );
    return wasPremiseChanged || wasConclusionChanged;
  }

  public setShowConfirmModal(shouldShowModal: boolean): void {
    this.modal.showConfirmModal = shouldShowModal;
  }

  private setShowConfirmModalOnClose(shouldShowModal: boolean): void {
    this.modal.showConfirmModalOnClose = shouldShowModal;
  }

  public onConditionsCheckboxesChange(model: ConditionsCheckboxesModel): void {
    this.conditionsCheckboxesModel = model;
  }
}
