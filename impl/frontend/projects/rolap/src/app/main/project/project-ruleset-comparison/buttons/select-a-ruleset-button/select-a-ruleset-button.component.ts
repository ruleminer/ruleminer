import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../../common/store/app-state.model';
import { V2ComparisonActions } from '../../../../../common/store/v2Comparison/v2Comparison.action';
import { ProjectRulesTableData } from '../../../project-rules/project-rules-table/models/rules-table';
import { CompareSelectRulesetService } from '../../service/compare-select-ruleset.service';

@Component({
  selector: 'rolap-select-a-ruleset-button',
  templateUrl: './select-a-ruleset-button.component.html',
  styleUrls: ['./select-a-ruleset-button.component.scss'],
})
export class SelectARulesetButtonComponent {
  @Input({ required: true }) projectRulesTableData: ProjectRulesTableData;
  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  private compareSelectRulesetService = inject(CompareSelectRulesetService);

  public selectRulesetsButtonClick(): void {
    this.compareSelectRulesetService
      .selectRulesets(this.projectRulesTableData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.store.dispatch(V2ComparisonActions.setSecondRuleset({ secondRuleset: event.secondRuleset }));
        this.store.dispatch(
          V2ComparisonActions.setRulesetDataToCompare({ rulesetDataToCompare: event.rulesetDataToCompare }),
        );
        this.store.dispatch(
          V2ComparisonActions.setSelectedRows({ selectedRowsUUIDs: [event.rulesetDataToCompare[0].uuid] }),
        );
        this.store.dispatch(
          V2ComparisonActions.setRulesetMetaToCompare({ rulesetMetaToCompare: event.rulesetMetaToCompare }),
        );
        this.store.dispatch(V2ComparisonActions.setCalculatedData({ data: null }));
        this.store.dispatch(V2ComparisonActions.setChartData({ data: null }));
        this.store.dispatch(V2ComparisonActions.setShowSomethingChangeWarning({ value: false }));
      });
  }
}
