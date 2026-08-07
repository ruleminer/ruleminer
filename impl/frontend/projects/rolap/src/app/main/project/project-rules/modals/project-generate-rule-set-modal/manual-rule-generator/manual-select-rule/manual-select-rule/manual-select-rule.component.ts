import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subscription, map, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { Project } from 'projects/rolap/src/app/main/project/models/project';
import { v4 as uuidv4 } from 'uuid';

import { Modal } from '../../../../../../../../common/services/modal/modal';
import { RuleSetService } from '../../../../../../../../common/services/rule-set/rule-set.service';
import { AppState, RuleTableUse } from '../../../../../../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../../../../../../common/store/project/project.selectors';
import { V2RulesTableData, V2RulesTableMeta } from '../../../../../../../../common/store/v2RulesTable/types';
import { convertRulesBigTableRowForBackendWithLabels } from '../../../../../../../../main/data-upload/utils/utils';
import { ProjectRulesTableData } from '../../../../../project-rules-table/models/rules-table';
import { RulesTableSettingsService } from '../../../../../project-rules-table/service/rules-table-settings.service';
import { ManualRuleSelectIds } from '../models';
import { makeDisplayConclusionValue } from '../../../../../../../../common/store/v2RulesTable/utils';
import { ProblemTypes } from '../../../../../../../data-upload/utils/enums';

@Component({
  selector: 'rolap-manual-select-rule',
  templateUrl: './manual-select-rule.component.html',
  styleUrls: ['./manual-select-rule.component.scss'],
})
export class ManualSelectRuleComponent implements OnInit, OnDestroy {
  @Input() manualRuleSelectIds: ManualRuleSelectIds;
  public projectRulesTableData: ProjectRulesTableData;

  public selectedDataSetId: number;
  public selectedItems: V2RulesTableData[] = [];
  public ruleSetData: V2RulesTableData;
  public someRulesAreNotSelectable = false;
  public readonly RuleTableUse = RuleTableUse;

  private rulesWithCoverageUuids: Set<string>;
  private ruleSetDataSubscription: Subscription;
  private ruleSetMeta: V2RulesTableMeta;

  constructor(
    private modal: Modal<ManualSelectRuleComponent>,
    private ruleSetService: RuleSetService,
    private store: Store<AppState>,
    private rulesTableSettingsService: RulesTableSettingsService,
  ) { }

  ngOnInit(): void {
    this.selectedDataSetId = this.manualRuleSelectIds.dataSetIds.current;
    this.getRulesetData();
  }

  ngOnDestroy(): void {
    this.ruleSetDataSubscription?.unsubscribe();
  }

  public onDataSetSelected() {
    this.getRulesetData();
  }

  public onSelectedRowsChanged(event: any) {
    this.selectedItems = event;
  }

  public activeCheckboxChanged(row: any): void {
    this.selectedItems.push({ ...row, isSelected: true });
  }

  public emitSelectedItems() {
    const tableForBackend = this.selectedItems.map((item: any) =>
      convertRulesBigTableRowForBackendWithLabels({
        ...item,
        uuid: uuidv4(),
      }),
    );

    this.modal.close({ items: tableForBackend, meta: this.ruleSetMeta });
  }

  public closeModal() {
    this.modal.close();
  }

  private getRulesetData() {
    this.ruleSetDataSubscription?.unsubscribe();
    this.ruleSetDataSubscription = this.store
      .select(activeProjectSelector)
      .pipe(
        switchMap((project: Project) => {
          return this.ruleSetService
            .getRulesetData(
              this.manualRuleSelectIds.dataSetIds.original,
              this.manualRuleSelectIds.ruleSetId,
              false,
              this.selectedDataSetId,
            )
            .pipe(map((res) => ({ res, project })));
        }),
      )
      .subscribe(({ res, project }) => {
        const projectRulesTableData: ProjectRulesTableData = {
          dataSetText: undefined,
          v2RulesTableData: res.table.map((row: any) => {
            return {
              ...row,
              displayConclusion: makeDisplayConclusionValue(project.type_of_problem, row.conclusion),
            }
          }
          ),
          ids: {
            ruleSetId: this.manualRuleSelectIds.ruleSetId,
            dataSetId: this.manualRuleSelectIds.dataSetIds.original,
            projectId: project.id,
          },
          typeOfProblem: project.type_of_problem,
          displayType: RuleTableUse.RULE_ADD_MODAL,
          selectMultiple: true,
          rulesUuidsToDisplay: null,
          settings: this.rulesTableSettingsService.getAllProjectRulesTableSettings(RuleTableUse.RULE_ADD_MODAL),
        };
        this.markRulesCoveringNoExamplesAsNotSelectable(res.table, project.type_of_problem);
        this.projectRulesTableData = projectRulesTableData;
        this.ruleSetMeta = res.meta;
      });
  }

  private markRulesCoveringNoExamplesAsNotSelectable(table: any[], problemType: ProblemTypes) {
    if (!this.rulesWithCoverageUuids) {
      this.rulesWithCoverageUuids = new Set(
        table.filter((ruleRow) => ruleRow.p + ruleRow.n !== 0).map((ruleRow) => ruleRow.uuid),
      );
    }
    this.ruleSetData = table.map((r) => {
      r.selectable = this.rulesWithCoverageUuids.has(r.uuid);
      r.displayConclusion = makeDisplayConclusionValue(problemType, r.conclusion);
      return r;
    });
    const notSelectableRulesCount: number = this.rulesWithCoverageUuids.size;
    this.someRulesAreNotSelectable = notSelectableRulesCount > 0;
  }
}
