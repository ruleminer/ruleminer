import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../utils/rxjsUtils';
import { combineLatest, debounceTime } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ValueChangedEvent } from 'devextreme/ui/check_box';

import { AppState } from '../../../../store/app-state.model';
import { V2VisualizationTabActions } from '../../../../store/v2VisualizationTab/v2VisualizationTab.action';
import {
  selectCurrentV2VisualizationRulesList,
  selectCurrentV2VisualizationRulesListFilteredBySearchValue,
  selectCurrentV2VisualizationTabHiddenRulesUUIDs,
  selectCurrentV2VisualizationTabShowSomeRulesWereUnselectedInfo,
} from '../../../../store/v2VisualizationTab/v2VisualizationTab.selectors';
import { isNotCausedByUserEvent } from '../../../../utils/devExtremeEventsUtils';

@Component({
  selector: 'rolap-rules-and-conditions-select-list',
  templateUrl: './rules-and-conditions-select-list.component.html',
  styleUrls: ['./rules-and-conditions-select-list.component.scss'],
})
export class RulesAndConditionsSelectListComponent implements OnInit {
  public filteredRules: any[] = [];
  public rules: any[] = [];
  public filter: string = '';
  public showWarning$ = this.store
    .select(selectCurrentV2VisualizationTabShowSomeRulesWereUnselectedInfo)
    .pipe(filterOutNullish());

  constructor(private store: Store<AppState>, private translate: TranslateService, private destroyRef: DestroyRef) {}

  ngOnInit() {
    combineLatest([
      this.store.select(selectCurrentV2VisualizationRulesList).pipe(filterOutNullish()),
      this.store.select(selectCurrentV2VisualizationTabHiddenRulesUUIDs),
      this.store
        .select(
          selectCurrentV2VisualizationRulesListFilteredBySearchValue(
            this.translate.instant('visualisation.coverage_table_columns.rule'),
          ),
        )
        .pipe(filterOutNullish()),
    ])
      .pipe(debounceTime(100), takeUntilDestroyed(this.destroyRef))
      .subscribe(([rules, hiddenRulesUUIDs, filteredRules]) => {
        rules.forEach((rule) => {
          rule.hidden = hiddenRulesUUIDs?.includes(rule.uuid) || false;
        });

        filteredRules.forEach((rule) => {
          rule.hidden = hiddenRulesUUIDs?.includes(rule.uuid) || false;
        });

        this.rules = rules;
        this.filteredRules = filteredRules;
      });
  }

  public onRuleChecked(uuid: string, event: ValueChangedEvent): void {
    if (isNotCausedByUserEvent(event)) return;

    const checked = event.value;
    this.updateRuleState(uuid, checked);

    const selectedSubconditionIndexes = this.getSelectedSubconditionIndexes(uuid);
    this.dispatchRuleToggle(uuid, selectedSubconditionIndexes);
  }

  public onHiddenClick(ruleUUid: string): void {
    const ruleIndex = this.filteredRules.findIndex((rule) => rule.uuid === ruleUUid);
    this.filteredRules[ruleIndex].hidden = !this.rules[ruleIndex].hidden;
    const hiddenRulesUUID = this.filteredRules[ruleIndex].uuid;
    this.store.dispatch(V2VisualizationTabActions.toggleHiddenRulesUUID({ hiddenRulesUUID }));
  }

  public onConditionChecked(uuid: string, conditionIndex: number, event: ValueChangedEvent): void {
    if (isNotCausedByUserEvent(event)) return;

    const checked = event.value;
    const findFilteredRuleIndex = this.filteredRules.findIndex((rule) => rule.uuid === uuid);
    this.filteredRules[findFilteredRuleIndex].premise.subconditions[conditionIndex].checked = checked;
    this.updateRuleStateBasedOnSubconditions(uuid);

    const selectedSubconditionIndexes = this.getSelectedSubconditionIndexes(uuid);
    this.dispatchRuleToggle(uuid, selectedSubconditionIndexes);
  }

  public closeWarningClick(): void {
    this.store.dispatch(
      V2VisualizationTabActions.setShowRulesWereUnselectedInfo({ showSomeRulesWereUnselectedInfo: false }),
    );
  }

  private updateRuleState(uuid: string, checked: boolean): void {
    const filteredRulesIndex = this.filteredRules.findIndex((rule) => rule.uuid === uuid);
    const rule = this.filteredRules[filteredRulesIndex];
    const subconditions = rule.premise.subconditions;

    subconditions.forEach((subcondition: any) => (subcondition.checked = checked));
    rule.checked = checked;

    const rulesIndex = this.rules.findIndex((rule) => rule.uuid === uuid);
    this.rules[rulesIndex].premise.subconditions.forEach((subcondition: any) => (subcondition.checked = checked));
    this.rules[rulesIndex].checked = checked;
  }

  private updateRuleStateBasedOnSubconditions(uuid: string): void {
    const filteredRulesUuidToIndex: Record<string, number> = this.filteredRules.reduce((acc, curr, index) => {
      acc[curr.uuid] = index;
      return acc;
    }, {});

    const filteredRulesIndex = filteredRulesUuidToIndex[uuid];
    const rule = this.filteredRules[filteredRulesIndex];
    const checkedSubconditionsCount = rule.premise.subconditions.filter(
      (subcondition: any) => subcondition.checked,
    ).length;

    rule.checked = checkedSubconditionsCount > 0;
    const ruleIndex = this.rules.findIndex((rule) => rule.uuid === uuid);
    this.rules[ruleIndex].checked = rule.checked;
  }

  private getSelectedSubconditionIndexes(uuid: string): number[] {
    const rulesIndex = this.rules.findIndex((rule) => rule.uuid === uuid);
    return this.rules[rulesIndex].premise.subconditions.reduce((acc: number[], subcondition: any, index: number) => {
      if (subcondition.checked) {
        acc.push(index);
      }
      return acc;
    }, []);
  }

  private dispatchRuleToggle(ruleUUid: string, selectedSubconditionIndexes: number[]): void {
    const selectedRule = {
      ruleUUid,
      selectedSubconditionIndexes,
    };
    const isUserAction = true;
    this.store.dispatch(V2VisualizationTabActions.toggleRule({ selectedRule, isUserAction }));
  }
}
