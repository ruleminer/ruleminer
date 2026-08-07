import { DestroyRef, Injectable, Injector, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { map, mergeMap, of, shareReplay, take } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { groupBy, isEqual, mapValues, sortBy } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { AppState } from '../../../../../../../common/store/app-state.model';
import { ProblemTypes } from '../../../../../../data-upload/utils/enums';
import { DatasetAttribute } from '../../../../../dataset/models/dataset';
import { DatasetService } from '../../../../../dataset/service/dataset.service';
import { Rule } from '../../../../../models/ruleset';
import { RulesEditorService } from '../../../../../service/rules-editor.service';
import { RuleMetricEntry } from '../../rules-editor-metrics/models';
import { RulesEditorMetricsService } from '../../rules-editor-metrics/service/rules-editor-metrics.service';
import { ConclusionTypes } from '../../rules-editor-side-column/rule-conclusion-editor/regression/models/conclusion';
import { REGRESSION_CONCLUSION_FIELD_TYPES } from '../../rules-editor-side-column/rule-conclusion-editor/regression/regression-rule-conclusion-editor.component';
import { RegressionRuleConclusionService } from '../../rules-editor-side-column/rule-conclusion-editor/regression/service/regression-rule-conclusion.service';
import { BaseConclusion } from '../../rules-editor-side-column/rule-conclusion-editor/rule-conclusion-editor.component';
import { DefaultKaplanMeierEstimatorService } from '../../rules-editor-side-column/rule-conclusion-editor/survival/service/default-kaplan-meier-estimator.service';
import {
  NominalAttributes,
  RulesEditorConfig,
  RulesEditorDisplayTypes,
  RulesTableEditorModalSettings,
  Subcondition,
  SubconditionType,
} from '../../types/rules-editor';
import { RulesEditorConfigFactory } from '../rules-editor-config-factory';
import { ConclusionEditorState, ListValueObject } from './types';

@Injectable()
export abstract class BaseEditorStateService {
  public problemType: ProblemTypes | null = null;
  public rulesEditorService = inject(RulesEditorService);
  public rulesEditorConfigFactory = inject(RulesEditorConfigFactory);
  public translate = inject(TranslateService);
  public metricsService = inject(RulesEditorMetricsService);
  public destroyRef = inject(DestroyRef);
  public store = inject(Store<AppState>);
  public injector = inject(Injector);
  public regessionRuleConclusionService = inject(RegressionRuleConclusionService);
  public defaultEstimatorService = inject(DefaultKaplanMeierEstimatorService);
  public datasetService = inject(DatasetService);

  public onLangChangeSignal = toSignal(this.translate.onLangChange);
  public hasOneConditionInGroupWarningSignal = computed(() => {
    const subconditions = this.subconditionsSignal();
    if (!subconditions || subconditions.length === 0) return false;

    const checkForRedundantNestedGroups = (conditions: Subcondition[]): boolean => {
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];

        if (condition.type === SubconditionType.Compound && condition.subconditions) {
          if (condition.subconditions.length === 1 && conditions.length >= 2) {
            return true;
          }

          if (checkForRedundantNestedGroups(condition.subconditions)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkForRedundantNestedGroups(subconditions);
  });

  public editorConclusionState = signal<ConclusionEditorState>(null);
  public lastSuccesfullEditorConclusionState = signal<ConclusionEditorState>(null);
  public preferredConditionCountSignal: WritableSignal<number | null> = signal<number | null>(null);

  public projectIdSig = signal<number | null>(null);
  public dataSetIdSig = signal<number | null>(null);
  public allAttributesSig = signal<DatasetAttribute[] | null>([]);
  /**
   * @description A signal that holds nominal attributes from /getNominalAttributes
   */
  public nominalAttributesSig = signal<NominalAttributes<string> | null>(null);

  /**
   * @description A computed signal that transforms the input,
   * preserving original keys and assigning values as arrays of other keys
   * that have the exact same corresponding value array, using Lodash.
   *
   * @example
   * Given nominalAttributesSig contains:
   * {
   * "hair": ["True", "False"],
   * "feathers": ["False", "True"],
   * "milk": ["True", "False"]
   * }
   *
   * crossReferencedAttributes will return:
   * {
   * "hair": ["hair", "milk"],
   * "feathers": ["feathers"],
   * "milk": ["hair", "milk"]
   * }
   */
  public getCrossReferencedAttributes(nominalAttributes: NominalAttributes<string> | null): {
    [key: string]: string[];
  } {
    if (!nominalAttributes) {
      return {};
    }

    const groupedByValueArray = groupBy(Object.keys(nominalAttributes), (attributeName) =>
      JSON.stringify(nominalAttributes[attributeName]),
    );

    const finalOutput = mapValues(nominalAttributes, (values, originalKey) => {
      const originalValueKey = JSON.stringify(values);
      return sortBy(groupedByValueArray[originalValueKey]);
    });

    return finalOutput;
  }

  public decisionAttributeSig = signal<string>('');
  public listValueObjectSignal = signal<ListValueObject>({ didChange: false, value: null });
  public isDxListEmptySignal = computed(() => {
    const listValueObjectSignal = this.listValueObjectSignal().value;
    if (!listValueObjectSignal || listValueObjectSignal === null) return true;
    return false;
  });
  public isDxListNotEmptySignal = computed(() => !this.isDxListEmptySignal());
  public originalRuleCoverageSig = signal<Record<string, number> | null>(null);
  public displayTypeSig = signal<RulesEditorDisplayTypes | null>(null);

  public distributionSignal = signal<any>(null);
  public subconditionsSignal = signal<Subcondition[]>([]);
  public conclusionSignal = signal<BaseConclusion | null>(null);
  public displayedMetrics = signal<RuleMetricEntry[] | null>(null);
  public rawRuleMetrics = signal<any>(null);
  public hasNoExamplesCoveredError = signal<boolean>(false);
  public coverage = signal<any>(null);
  public conclusionDropDownItemsSignal: Signal<any[]> = computed(() => []);
  public uuidSignal = signal<string | null>(null);
  public conditionCoverageLoading = signal(false);
  public isTouched = signal<boolean>(false);

  // Simplified: single boolean flag indicating if any value input shows a visible error
  public hasValueInputsValidationErrorsSignal = signal<boolean>(false);

  public setValueInputsValidationErrors(hasErrors: boolean): void {
    this.hasValueInputsValidationErrorsSignal.set(!!hasErrors);
  }

  public readonly NO_EXAMPLES_COVERED_ERROR: string = 'no_example_covered_error';

  public availableMetrics$ = computed(() => {
    const projectId = this.projectIdSig();
    if (!projectId) return of([]);
    return this.metricsService.getAvailableRuleMetrics(projectId).pipe(shareReplay(1));
  });
  public metricsToDisplay$ = computed(() => {
    return this.availableMetrics$().pipe(
      mergeMap((availableMetrics: string[]) => {
        return this.metricsService.getMetricsNamesToDisplay(this.problemType as ProblemTypes, availableMetrics);
      }),
      map((metrics: string[]) => {
        return metrics.filter((m) => {
          let includes = false;
          this.availableMetrics$()
            .pipe(
              take(1),
              map((available) => available.includes(m)),
            )
            .subscribe((incl) => (includes = incl));
          return includes;
        });
      }),
      shareReplay(1),
    );
  });

  /**
   * @computed allAttributesNamesSignal
   * @description A computed signal that extracts and provides a list of attribute names
   * from the `allAttributesSig` signal.
   */
  public allAttributesNamesSignal = computed(() => {
    return this.allAttributesSig()?.map((attr) => attr.name) || null;
  });

  /**
   * @computed configSignal
   * @description A computed signal that provides the `RulesEditorConfig`.
   * It uses `RulesEditorConfigFactory` to create the configuration
   * based on the display type signal.
   * The configuration values determine how the editor behaves.
   */
  public configSignal: Signal<RulesEditorConfig | null> = computed(() => {
    const displayType = this.displayTypeSig();
    if (!displayType || !this.problemType) return null;
    return this.rulesEditorConfigFactory.make(this.problemType, displayType);
  });

  /**
   * @computed actualRuleString
   * @description A computed signal that generates the actual rule string
   * based on the current subconditions, conclusion, and decision attribute.
   * It uses `RulesEditorService` to construct the rule string.
   * This value is used when the user saves an edited rule and is also displayed
   * in the footer as "Modified rule."
   * The editor footer component reads this value once to set the "Original Rule" and remembers it.
   */
  public actualRuleString = computed(() => {
    const subconditions = this.subconditionsSignal();
    const conclusion = this.editorConclusionState();
    const decisionAttributeName = this.decisionAttributeSig();

    if (!subconditions?.length || !conclusion || !decisionAttributeName || !this.problemType) {
      return '';
    }

    if (this.problemType === ProblemTypes.Regression) {
      if ((conclusion as any).value === null) return '';
    }

    const attributeNames = this.allAttributesNamesSignal();
    const allAttributes = this.allAttributesSig();
    if (!attributeNames || !allAttributes) return '';

    return this.rulesEditorService.createRuleString(
      this.problemType,
      subconditions,
      attributeNames,
      conclusion as any,
      decisionAttributeName,
      allAttributes,
    );
  });

  /**
   * @computed ruleSig
   * @description A computed signal that creates and provides the Rule object,
   * representing the rule being edited.
   * It uses `RulesEditorService` to create the Rule object based on the current subconditions,
   * conclusion, and other relevant signals.
   * This value is used when the user saves the edited rule.
   */
  public ruleSig = computed<Rule | null>(() => {
    const attributeNames = this.allAttributesNamesSignal();
    const config = this.configSignal();
    const subconditions = this.subconditionsSignal();
    const editorConclusionState = this.editorConclusionState();
    const uuid = this.uuidSignal();
    if (!attributeNames || !config || !subconditions || !editorConclusionState) return null;
    const conclusion = editorConclusionState;
    const ruleObjectUuid = config.isEdit ? uuid : uuidv4();
    const ruleObject = this.rulesEditorService.createRuleObject(
      ruleObjectUuid as string,
      subconditions,
      conclusion,
      attributeNames,
    );
    return ruleObject;
  });

  problemTypeSig?: Signal<ProblemTypes> | undefined;

  setProjectId(projectId: number): void {
    this.projectIdSig.set(projectId);
  }
  setDataSetId(dataSetId: number): void {
    this.dataSetIdSig.set(dataSetId);
  }
  setNominalAttributes(nominalAttr: NominalAttributes<string>): void {
    this.nominalAttributesSig.set(nominalAttr);
  }
  setDecisionAttribute(decisionAttribute: string): void {
    this.decisionAttributeSig.set(decisionAttribute);
  }
  setOriginalRuleCoverageSig(originalRuleCoverage: Record<string, number> | null): void {
    if (this.originalRuleCoverageSig()) return;
    this.originalRuleCoverageSig.set(originalRuleCoverage);
  }
  setAllAttributes(attributes: DatasetAttribute[] | null): void {
    this.allAttributesSig.set(attributes);
  }
  setDisplayType(displayType: RulesEditorDisplayTypes): void {
    this.displayTypeSig.set(displayType);
  }
  setsubconditionsSignal(subconditions: Subcondition[]): void {
    // The attributes field for "compound" conditions should recursively aggregate all attribute indices from its subconditions

    const collectAttributes = (subcondition: Subcondition): number[] => {
      if (subcondition.type === SubconditionType.Compound && subcondition.subconditions) {
        const allAttributes = subcondition.subconditions.flatMap((sub) => collectAttributes(sub));
        return [...new Set(allAttributes)].sort((a, b) => a - b);
      } else {
        return subcondition.attributes || [];
      }
    };
    subconditions = subconditions.map((sub) => {
      if (sub.type === SubconditionType.Compound) {
        sub.attributes = collectAttributes(sub);
      }
      return sub;
    });
    this.subconditionsSignal.set(subconditions);
  }
  setConclusionSignal(conclusion: BaseConclusion | null): void {
    this.conclusionSignal.set(conclusion);
  }
  updateOnEmptyCoverage(): void {
    this.displayedMetrics.update((metrics: any) => metrics.map((m: any) => ({ ...m, value: null })));
  }

  /**
   * Initializes editor state values when the modal opens.
   * Sets project, dataset, decision attribute, display type, and UUID signals,
   * Sets `editorConclusionState` and `uuidSignal` to null.
   *
   * @param settings The initial editor state values.
   */
  setModalSettings(settings: RulesTableEditorModalSettings) {
    this.resetValues();
    this.setProjectId(settings.ids.projectId!);
    this.setDataSetId(settings.ids.dataSetId!);
    this.setDecisionAttribute(settings.decisionAttributeName);
    this.setDisplayType(settings.displayType);
    this.editorConclusionState.set(null);
    this.uuidSignal.set(settings.uuid);
  }

  setEditorConclusionState(value: ConclusionEditorState): void {
    this.editorConclusionState.set(value);
  }

  /**
   * Updates the `listValueObjectSignal` with a new value
   *
   * It compares the `previousValue` and `value` fields (flatting arrays if needed) to determine
   * if there was any change. If the `previousValue` is null or an empty array, it assumes no change.
   *
   * The result is stored in the `didDxListValueObjectChange` property, which is then added to the
   * new `DxListValueObject` and set in the `listValueObjectSignal`.
   *
   * @param value The new value object to update, excluding the `didDxListValueObjectChange` field.
   */
  setlistValueObjectSignal(value: Subcondition[]): void {
    const previousValue = this.listValueObjectSignal().value;

    let didListValueObjectChange = false;

    if (previousValue == null) {
      didListValueObjectChange = false;
    } else {
      didListValueObjectChange = !isEqual(
        Array.isArray(previousValue) ? previousValue.flat() : previousValue,
        Array.isArray(value) ? value.flat() : value,
      );
    }

    if (didListValueObjectChange) {
      this.isTouched.set(true);
    }
    this.listValueObjectSignal.set({ value, didChange: didListValueObjectChange });
  }

  dxListValueObjectChangeSet(didChange: boolean) {
    this.listValueObjectSignal.update((value) => {
      return { ...value, didChange };
    });
  }

  regressionConclusionTypeChange(selectedConclusionType: ConclusionTypes): void {
    throw new Error('Method not implemented.');
  }
  regresionConclusionInputChange(value: number, fieldType: REGRESSION_CONCLUSION_FIELD_TYPES): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Resets the relevant state values to their initial states (or null).
   */
  public resetValues(): void {
    this.conditionCoverageLoading.set(false);
    this.editorConclusionState.set(null);
    this.lastSuccesfullEditorConclusionState.set(null);
    this.preferredConditionCountSignal.set(null);
    this.projectIdSig.set(null);
    this.dataSetIdSig.set(null);
    this.allAttributesSig.set([]);
    this.nominalAttributesSig.set(null);
    this.decisionAttributeSig.set('');
    this.listValueObjectSignal.set({ value: null, didChange: false });
    this.originalRuleCoverageSig.set(null);
    this.displayTypeSig.set(null);
    this.distributionSignal.set(null);
    this.subconditionsSignal.set([]);
    this.conclusionSignal.set(null);
    this.displayedMetrics.set([]);
    this.rawRuleMetrics.set(null);
    this.hasNoExamplesCoveredError.set(false);
    this.coverage.set(null);
    this.uuidSignal.set(null);
    this.isTouched.set(false);
    // Reset value-input errors flag
    this.hasValueInputsValidationErrorsSignal.set(false);
  }
}
