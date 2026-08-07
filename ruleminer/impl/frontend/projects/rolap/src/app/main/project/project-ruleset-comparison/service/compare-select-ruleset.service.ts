import { Injectable } from '@angular/core';

import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { Observable, filter, map, shareReplay, switchMap, take, zip } from 'rxjs';

import { Store } from '@ngrx/store';

import { ModalRef } from '../../../../common/services/modal/modal-ref';
import { ModalService } from '../../../../common/services/modal/modal.service';
import { RuleSetApiService } from '../../../../common/services/rule-set/rule-set-api.service';
import { AppState } from '../../../../common/store/app-state.model';
import { removeIfAndThenFromRule } from '../../../../common/store/ruleSets/rulesets.reducer';
import { selectCurrentV2ComparisonSecondRuleset } from '../../../../common/store/v2Comparison/v2Comparison.selectors';
import { JSONRuleSetResponse, RuleCoverageResponse, RuleCoverageRow } from '../../models/ruleset';
import { ProjectRulesTableData } from '../../project-rules/project-rules-table/models/rules-table';
import { ProjectService } from '../../service/project.service';
import { SelectRulesetsModalComponent } from '../buttons/select-a-ruleset-button/select-rulesets-modal/select-rulesets-modal.component';
import { SelectedDataset, SelectedRuleSetModalData } from '../buttons/select-a-ruleset-button/types';

@Injectable({
  providedIn: 'root',
})
export class CompareSelectRulesetService {
  constructor(
    private projectService: ProjectService,
    private modalService: ModalService,
    private ruleSetApiService: RuleSetApiService,
    private store: Store<AppState>,
  ) {}

  /**
   * Opens the modal to select rulesets and fetches the ruleset data.
   */
  public selectRulesets(projectRulesTableData: ProjectRulesTableData) {
    return this.openSelectRulesetsModal(projectRulesTableData).pipe(
      switchMap((modalRes) => this.fetchRulesetData(projectRulesTableData, modalRes as SelectedDataset[])),
    );
  }

  /**
   * Opens the select rulesets modal.
   */
  private openSelectRulesetsModal(projectRulesTableData: ProjectRulesTableData): Observable<SelectedDataset[]> {
    return this.store.select(selectCurrentV2ComparisonSecondRuleset).pipe(
      filterOutNullish(),
      take(1),
      switchMap((secondRuleset) => {
        return this.modalService
          .open(SelectRulesetsModalComponent, 'comparison_view.select_ruleset', '500px', '400px', {
            datasetId: projectRulesTableData.ids.dataSetId,
            secondRulesetId: secondRuleset.id,
          })
          .pipe(
            switchMap((modalRef: ModalRef<SelectRulesetsModalComponent>) =>
              modalRef.getResult<SelectedDataset[]>().pipe(filter((res) => res !== undefined)),
            ),
          );
      }),
    );
  }

  /**
   * Fetches the ruleset data based on the selected dataset from the modal.
   */
  private fetchRulesetData(projectRulesTableData: ProjectRulesTableData, modalRes: SelectedDataset[]) {
    const dataSetId = projectRulesTableData.ids.dataSetId!;
    const ruleSetId = modalRes[0].id as number;

    const ruleSet$ = this.projectService.getRuleSet(dataSetId, ruleSetId).pipe(shareReplay(1), take(1));
    const coverage$ = this.projectService.getRulesCoverage(dataSetId, ruleSetId).pipe(take(1));
    const indicators$ = this.projectService.getRulesIndicators(dataSetId, ruleSetId).pipe(
      take(1),
      map((indicators) =>
        indicators.map((indicator) => ({
          rule_uuid: indicator.rule_uuid,
          ...indicator.indicators,
        })),
      ),
    );
    const labels$ = this.ruleSetApiService.getLabels(ruleSetId);

    return zip(ruleSet$, coverage$, indicators$, labels$).pipe(
      take(1),
      map(([rules, coverage, indicators, labels]) => ({
        rules,
        coverage,
        indicators,
        labels,
        modalRes,
      })),
      map((data) => this.handleFetchedData(data)),
    );
  }

  /**
   * Processes the fetched data and returns the formatted result.
   */
  public handleFetchedData({
    rules,
    coverage,
    indicators,
    labels,
    modalRes,
  }: {
    rules: JSONRuleSetResponse;
    coverage: RuleCoverageResponse;
    indicators: any[];
    labels: Record<string, number>;
    modalRes: SelectedDataset[];
  }): SelectedRuleSetModalData {
    const rulesets = modalRes;
    const mappedCoverage: RuleCoverageRow[] = this.mapCoverageData(coverage);
    const coverageMap = new Map(mappedCoverage.map((coverage) => [coverage.uuid, coverage]));
    const indicatorsMap = new Map(indicators.map((indicator) => [indicator.rule_uuid, indicator]));

    const rulesetDataToCompare = rules.rules.map((ruleData, index) => {
      const uuid = ruleData.uuid;
      const coverageData = coverageMap.get(uuid);
      const indicatorData = indicatorsMap.get(uuid);
      return {
        ...ruleData,
        displayString: removeIfAndThenFromRule(ruleData.string),
        ...coverageData,
        ...indicatorData,
        labels: labels[uuid],
        autoIncrement: index + 1,
      };
    });

    return {
      rulesetDataToCompare,
      secondRuleset: {
        name: rulesets[0].name,
        id: rulesets[0].id,
        fullName: `${rulesets[0].name} (${rulesets[0].id})`,
      },
      rulesetMetaToCompare: rules.meta,
    };
  }

  /**
   * Maps the coverage data.
   */
  private mapCoverageData(coverage: RuleCoverageResponse): RuleCoverageRow[] {
    return Object.keys(coverage.rule_coverage).map((key) => ({
      ...coverage.rule_coverage[key],
      uuid: key,
    }));
  }
}
