import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { take } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { selectPredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/predictionConfigOptions.selectors';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';

import { Rule } from '../../../../models/ruleset';
import {
  DisplayType,
  RulesetPredictionConfigurationComponentData,
} from '../../../../project-description/ruleset-prediction-configuration/types';
import { buildPredictionConfigForm } from '../../../../project-description/ruleset-prediction-configuration/utils';
import { ManualGenerationConfigChangeEvent } from './types';

@Component({
  selector: 'rolap-manual-ruleset-generator',
  templateUrl: './manual-ruleset-generator.component.html',
  styleUrls: ['./manual-ruleset-generator.component.scss'],
})
export class ManualRulesetGeneratorComponent implements OnInit {
  @Input() ids: Ids;
  @Output() setShowConfirmModal = new EventEmitter<boolean>();
  @Output() dataChanged = new EventEmitter<ManualGenerationConfigChangeEvent>();

  private store = inject(Store<AppState>);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public predictionConfigurationFormData: RulesetPredictionConfigurationComponentData;
  private predictionConfigFormGroup: FormGroup;
  private isValid = false;
  private manuallySelectedIds: { ruleSetId: number; dataSetId: number };
  public selectedManuallyRules: Rule[] = [];

  ngOnInit(): void {
    this.buildPredictionConfigForm();
    this.emitDataChange();
  }

  public onCurrentSelectItemChange(selectedItem: { dataSetId: number; ruleSetId: number }): void {
    if (selectedItem) this.setShowConfirmModal.emit(true);
    this.manuallySelectedIds = { dataSetId: selectedItem.dataSetId, ruleSetId: selectedItem.ruleSetId };
  }

  public onSelectedRulesChanged(selectedRules: any[]): void {
    this.selectedManuallyRules = selectedRules;
    this.emitDataChange();
    this.setShowConfirmModal.emit(true);
  }

  public onManualRulesListChange(event: Rule[]) {
    const newIsValid = event.length > 0;
    if (newIsValid !== this.isValid) {
      this.isValid = newIsValid;
      this.emitDataChange();
    }
    this.setShowConfirmModal.emit(true);
  }

  private buildPredictionConfigForm() {
    this.store
      .select(selectPredictionConfigOptions)
      .pipe(filterOutNullish(), take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((predictionConfigOptions) => {
        this.predictionConfigFormGroup = buildPredictionConfigForm(this.fb, predictionConfigOptions);
        this.predictionConfigurationFormData = {
          formGroup: this.predictionConfigFormGroup,
          displayType: DisplayType.RuleSetCreation,
        };
      });
  }

  private emitDataChange() {
    this.dataChanged.emit({
      valid: this.isValid,
      manuallySelectedIds: this.manuallySelectedIds,
      selectedManuallyRules: this.selectedManuallyRules,
      predictionConfig: this.predictionConfigFormGroup.value,
    });
  }
}
