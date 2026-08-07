import { Component, EventEmitter, Output, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { AppState } from '../../../../../../common/store/app-state.model';
import { activeProjectProblemTypeSelector } from '../../../../../../common/store/project/project.selectors';
import { removeIfAndThenFromRule } from '../../../../../../common/store/ruleSets/rulesets.reducer';
import { EDITOR_STATE_SERVICE_TOKEN } from '../service/editor-state/editor-state.provider';

@Component({
  selector: 'rolap-project-rules-table-footer',
  templateUrl: './project-rules-table-footer.component.html',
  styleUrls: ['./project-rules-table-footer.component.scss'],
})
export class ProjectRulesTableFooterComponent {
  private editorStateService = inject(EDITOR_STATE_SERVICE_TOKEN, { skipSelf: true });
  private store = inject(Store<AppState>);

  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  public problemTypeSignal = toSignal(this.store.select(activeProjectProblemTypeSelector).pipe(filterOutNullish()));
  public valid = computed(() => {
    const { listValueObjectSignal, decisionAttributeSig, ruleSig } = this.editorStateService;
    const dxListValueObject = listValueObjectSignal();
    if (!dxListValueObject?.value) return false;
    return dxListValueObject.value.length !== 0 && !!decisionAttributeSig() && !!ruleSig();
  });
  

  public hasNoExamplesCoveredErrorSignal = this.editorStateService.hasNoExamplesCoveredError;
  public hasValueInputsValidationErrorsSignal = this.editorStateService.hasValueInputsValidationErrorsSignal;
  public hasOneConditionInGroupWarningSignal = computed(() =>
    this.editorStateService.hasOneConditionInGroupWarningSignal() && !this.hasValueInputsValidationErrorsSignal()
  );
  public stringSignal = this.editorStateService.actualRuleString;
  public isDxListNotEmptySignal = this.editorStateService.isDxListNotEmptySignal;
  public configSignal = this.editorStateService.configSignal;
  public stringWithoutIfAndThenSignal = computed(() => removeIfAndThenFromRule(this.stringSignal()));
  public originalString = signal('');

  private isEditBlockExecuted = signal(false);

  constructor() {
    this._setupOriginalStringCaptureEffect();
    this._setupEditFlagResetEffect();
  }

  public onSubmit(): void {
    this.submit.emit();
  }

  public onCancel(): void {
    this.cancel.emit();
  }

  /**
   * @effect _setupOriginalStringCaptureEffect
   * @description Captures the initial rule string (`stringSignal`) into `originalString`
   * when the component enters edit mode (`config.isEdit` is true) and relevant data is available.
   * Uses the `isEditBlockExecuted` flag to ensure this capture happens only once
   * per initialization of the editor.
   */
  private _setupOriginalStringCaptureEffect(): void {
    effect(
      () => {
        const { configSignal, displayedMetrics } = this.editorStateService;
        const config = configSignal();
        const isEditBlockExecuted = this.isEditBlockExecuted();
        const currentRuleString = this.stringSignal();
        const displayedMetricsValue = displayedMetrics();

        if (!config?.isEdit || isEditBlockExecuted || !currentRuleString || !displayedMetricsValue) {
          return;
        }

        this.originalString.set(currentRuleString);
        this.isEditBlockExecuted.set(true);
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * @effect _setupEditFlagResetEffect
   * @description Resets the `isEditBlockExecuted` flag whenever the component's configuration (`configSignal`) changes.
   * This allows the `_setupOriginalStringCaptureEffect` to potentially run again if the component's
   * configuration changes (e.g., switching from add to edit mode, or editing a different rule).
   */
  private _setupEditFlagResetEffect(): void {
    effect(
      () => {
        const config = this.configSignal();
        this.isEditBlockExecuted.set(false);
      },
      { allowSignalWrites: true },
    );
  }
}
