import { Component, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder } from '@angular/forms';

import { map } from 'rxjs';

import { Store } from '@ngrx/store';

import { ModalBtns } from '../../../../../../../common/services/modal/modal-btns';
import { AppState } from '../../../../../../../common/store/app-state.model';
import { selectCurrentV2TabText } from '../../../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { CustomTitleRuleSetValidation } from '../../../../../../data-upload/utils/formValidators';

@Component({
  selector: 'rolap-project-save-rules-table-modal',
  templateUrl: './project-save-rules-table-modal.component.html',
  styleUrls: ['./project-save-rules-table-modal.component.scss'],
})
export class ProjectSaveRulesTableModalComponent extends ModalBtns<ProjectSaveRulesTableModalComponent> {
  public form = this.fb.group({
    ruleSetName: this.fb.control('', CustomTitleRuleSetValidation),
    overwrite: this.fb.control(true),
  });

  public ruleSetNameValidationStatus = computed(() =>
    this.form.controls['ruleSetName'].invalid ? 'invalid' : 'valid',
  );

  private currentRuleSetName = toSignal(this.store.select(selectCurrentV2TabText));
  private isOverwriteChecked = toSignal(this.form.valueChanges.pipe(map(({ overwrite }) => !!overwrite)));

  constructor(private store: Store<AppState>, private fb: NonNullableFormBuilder) {
    super();
    effect(() => this.handleOverwriteToggle(this.isOverwriteChecked() as boolean), { allowSignalWrites: true });
  }

  private handleOverwriteToggle(isOverwriteChecked: boolean): void {
    const ruleSetNameControl = this.form.controls['ruleSetName'];
    if (!isOverwriteChecked) return ruleSetNameControl.enable();
    ruleSetNameControl.setValue(this.currentRuleSetName() as string);
    ruleSetNameControl.disable();
  }
}
