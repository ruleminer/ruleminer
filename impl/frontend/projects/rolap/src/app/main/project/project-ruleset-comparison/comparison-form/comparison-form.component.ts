import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Subject, skip, switchMap, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';

import { FormGroupTitleConfig } from '../../../../common/components/buttons/form-group-title/types';
import { RadioItem } from '../../../../common/components/buttons/radio/types';
import { SelectBoxItem } from '../../../../common/components/buttons/select-box/types';
import { AppState } from '../../../../common/store/app-state.model';
import { V2ComparisonActions } from '../../../../common/store/v2Comparison/v2Comparison.action';
import { selectCurrentV2Comparison } from '../../../../common/store/v2Comparison/v2Comparison.selectors';
import { selectCurrentV2TabId } from '../../../../common/store/v2CurrentTab/v2CurrentTab.selectors';
import { V2RulesTableActions } from '../../../../common/store/v2RulesTable/v2RulesTable.action';

@Component({
  selector: 'rolap-comparison-form',
  templateUrl: './comparison-form.component.html',
  styleUrls: ['./comparison-form.component.scss'],
})
export class ComparisonFormComponent implements OnInit {
  public dropdownItems: SelectBoxItem[] = [];
  public form: FormGroup;
  public readonly comparisonMeasuresDropDownTitle: FormGroupTitleConfig = {
    title: 'comparison_view.chosen_metric',
    tooltip: 'tooltips.rules_table.chosen_metric',
  };
  public readonly relationTypeItems: RadioItem[] = [
    { label: 'comparison_view.oneToMany', value: true },
    { label: 'comparison_view.manyToMany', value: false },
  ];
  public readonly relationTypeTitle: FormGroupTitleConfig = {
    title: 'comparison_view.relation_type',
    tooltip: 'tooltips.rules_table.relation_type',
  };
  public readonly similarityTypeItems: RadioItem[] = [
    { label: 'comparison_view.syntactic', value: true },
    { label: 'comparison_view.semantic', value: false },
  ];
  public readonly similarityTypeTitle: FormGroupTitleConfig = {
    title: 'comparison_view.similarity_type',
    tooltip: 'tooltips.rules_table.similarity_type',
  };

  public showDropDown: boolean = false;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(private formBuilder: FormBuilder, private store: Store<AppState>) {}

  ngOnInit(): void {
    this.setForm();
  }

  private setForm() {
    this.store
      .select(selectCurrentV2TabId)
      .pipe(
        filterOutNullish(),
        switchMap(() => {
          this.createEmptyForm();
          //When the current tab changes, select the current v2Comparison form state and set initial form values once.
          return this.store.select(selectCurrentV2Comparison).pipe(filterOutNullish(), take(1));
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((v2Comparison) => {
        this.dropdownItems = v2Comparison.dropDownItems;
        this.form.setValue(
          {
            similarityType: v2Comparison.formState.similarityType,
            relationType: v2Comparison.formState.relationType,
            comparisonMeasures: v2Comparison.formState.comparisonMeasures,
          },
          { emitEvent: false },
        );
      });

    // When the form changes, save the form state to the store
    this.form.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((formValue) => {
      this.store.dispatch(V2ComparisonActions.saveFormState({ formState: formValue }));
      const value = this.form.dirty;
      if (!value) return;
      this.store.dispatch(V2ComparisonActions.setShowSomethingChangeWarning({ value }));
    });

    // When the similarityType changes, update the dropDown flag
    this.form.controls['similarityType'].valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((similarityType) => {
        this.showDropDown = !similarityType;
      });

    // When relationType changes update the current v2RulesTable. Set first row compare value to true rest to false
    this.form.controls['relationType'].valueChanges
      .pipe(
        skip(1), // Skip the one otherwise it will set first table compare values to defualt state
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => {
        this.store.dispatch(V2RulesTableActions.markFirstRuleSetToCompareInCurrentTable());
      });
  }

  private createEmptyForm(): void {
    this.form = this.formBuilder.group({
      similarityType: new FormControl(null),
      relationType: new FormControl(null),
      comparisonMeasures: new FormControl(null),
    });
  }
}
