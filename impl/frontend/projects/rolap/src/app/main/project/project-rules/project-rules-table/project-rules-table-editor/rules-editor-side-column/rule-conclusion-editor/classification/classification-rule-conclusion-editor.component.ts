import { Component, computed, effect, inject } from '@angular/core';

import { ValueChangedEvent } from 'devextreme/ui/select_box';

import { isNotCausedByUserEvent } from '../../../../../../../../common/utils/devExtremeEventsUtils';
import { EDITOR_STATE_SERVICE_TOKEN } from '../../../service/editor-state/editor-state.provider';
import { ClassificationEditorStateService } from '../../../service/editor-state/project-types/classification-editor-state.service';

export interface ClassificationConclusionValue {
  value: string;
}

@Component({
  selector: 'rolap-classification-rule-conclusion-editor',
  templateUrl: './classification-rule-conclusion-editor.component.html',
  styleUrls: ['./classification-rule-conclusion-editor.component.scss'],
})
export class ClassificationRuleConclusionEditorComponent {
  private editorStateService = inject<ClassificationEditorStateService>(EDITOR_STATE_SERVICE_TOKEN, { skipSelf: true });

  private readonly coverageSignal = this.editorStateService.coverage;
  private readonly distributionSignal = this.editorStateService.distributionSignal;
  private ruleSignal = this.editorStateService.ruleSig;
  private conclusionSignal = computed(() => this.ruleSignal()?.conclusion);

  public conclusionDropDownItemsSignal = this.editorStateService.conclusionDropDownItemsSignal;
  public selectedValue = computed(() => {
    const editorConclusionState = this.editorStateService.editorConclusionState();
    const conclusioneditorSelectedValueObj = Array.isArray(editorConclusionState)
      ? editorConclusionState[0]
      : editorConclusionState;
    return conclusioneditorSelectedValueObj?.value;
  });

  public dataSourceSignal = computed(() => {
    const coverage = this.coverageSignal();
    const distribution = this.distributionSignal();

    if (!coverage?.length || !distribution) return null;

    const coverageData = coverage[0];
    return Object.keys(coverageData).map((key) => ({
      class_name: key,
      coverage_count: coverageData[key],
      all_count: distribution[key],
    }));
  });

  constructor() {
    this._setupInitialSelectionEffect();
  }

  /**
   * @effect _setupInitialSelectionEffect
   * @description Sets initial editor selection in service if no selection exists.
   */
  private _setupInitialSelectionEffect(): void {
    effect(
      () => {
        const conclusion = this.conclusionSignal();
        if (!conclusion) return;
        if (this.selectedValue() == null) {
          this.onConclusionValueSelected(conclusion.value);
        }
      },
      { allowSignalWrites: true },
    );
  }

  public onConclusionValueSelected(event: ValueChangedEvent): void {
    if (!isNotCausedByUserEvent(event)) this.editorStateService.isTouched.set(true);
    const selectedClass = event.value;
    this.editorStateService.setEditorConclusionState([{ value: selectedClass }]);
  }
}
