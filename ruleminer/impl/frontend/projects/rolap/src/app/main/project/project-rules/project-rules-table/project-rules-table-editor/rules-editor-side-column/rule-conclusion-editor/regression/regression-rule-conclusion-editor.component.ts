import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { take } from 'rxjs';

import { Store } from '@ngrx/store';
import { ItemClickEvent } from 'devextreme/ui/select_box';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { selectCurrentV2RulesTableLabelMinMaxValues } from '../../../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { isNotCausedByUserEvent } from '../../../../../../../../common/utils/devExtremeEventsUtils';
import { ProblemTypes } from '../../../../../../../data-upload/utils/enums';
import { EDITOR_STATE_SERVICE_TOKEN } from '../../../service/editor-state/editor-state.provider';
import { RegressionEditorStateService } from '../../../service/editor-state/project-types/regression-editor-state.service';
import { ConclusionEditorStates } from '../../../service/editor-state/types';
import { ConclusionTypes } from './models/conclusion';

export enum REGRESSION_CONCLUSION_FIELD_TYPES {
  LOW = 'low',
  VALUE = 'value',
  HIGH = 'high',
  TYPE = 'type',
}

@Component({
  selector: 'rolap-regression-rule-conclusion-editor',
  templateUrl: './regression-rule-conclusion-editor.component.html',
  styleUrls: ['./regression-rule-conclusion-editor.component.scss'],
})
export class RegressionRuleConclusionEditorComponent {
  private store = inject(Store<AppState>);
  private editorStateService = inject<RegressionEditorStateService>(EDITOR_STATE_SERVICE_TOKEN);

  private ruleSignal = this.editorStateService.ruleSig;
  public conclusionDropDownItemsSignal = this.editorStateService.conclusionDropDownItemsSignal;
  public editedConclusion = computed(() => {
    const conclusion = this.editorConclusionState();
    if (!conclusion) return;
    return conclusion;
  });
  public readonlySignal = computed(() => this.conclusionType() === ConclusionTypes.AUTOMATIC);
  public disabledSignal = computed(() => this.ruleSignal()?.premise?.subconditions?.length === 0);
  public editedConclusionLowSignal = computed(() => this.editorConclusionState()?.low as number);
  public editedConclusionValueSignal = computed(() => this.editorConclusionState()?.value as number);
  public editedConclusionHighSignal = computed(() => this.editorConclusionState()?.high as number);
  public conclusionType = computed(() =>
    this.editorConclusionState()?.fixed ? ConclusionTypes.MANUAL : ConclusionTypes.AUTOMATIC,
  );

  public editorConclusionState = computed(
    () => this.editorStateService.editorConclusionState() as ConclusionEditorStates[ProblemTypes.Regression],
  );
  public labelMinMaxValuesSignal = toSignal(
    this.store.select(selectCurrentV2RulesTableLabelMinMaxValues).pipe(filterOutNullish(), take(1)),
  );
  public minLabelValueSignal = computed(() => this.labelMinMaxValuesSignal()?.min);
  public maxLabelValueSignal = computed(() => this.labelMinMaxValuesSignal()?.max);

  public readonly EDITOR_NUMBER_FORMAT = '#0.###';
  public readonly DISPLAY_NUMBER_FORMAT = '1.1-3';
  public readonly FIELD_TYPES = REGRESSION_CONCLUSION_FIELD_TYPES;

  public onValueSelected(
    e: any,
    fieldType:
      | REGRESSION_CONCLUSION_FIELD_TYPES.LOW
      | REGRESSION_CONCLUSION_FIELD_TYPES.VALUE
      | REGRESSION_CONCLUSION_FIELD_TYPES.HIGH,
  ): void {
    if (!isNotCausedByUserEvent(e)) this.editorStateService.isTouched.set(true);
    this.editorStateService.regresionConclusionInputChange(e.value, fieldType);
  }

  public onConclusionTypeChanged(event: ItemClickEvent): void {
    if (!isNotCausedByUserEvent(event)) this.editorStateService.isTouched.set(true);
    const selected = event.itemData.value;

    this.editorStateService.regressionConclusionTypeChange(selected);
  }
}
