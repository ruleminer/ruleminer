import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { EMPTY, Subject, Subscription, map, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';
import { MasterDetailTemplateData } from 'devextreme/ui/data_grid';

import { RuleSetApiService } from '../../../../common/services/rule-set/rule-set-api.service';
import { AppState } from '../../../../common/store/app-state.model';
import { Ids } from '../../../../common/store/ruleSets/rulesets.selectors';
import { selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { TreeviewRefreshService } from '../../dataset/treeview/service/treeview-refresh.service';
import { RuleSetDetailsResponse } from '../../models/ruleset';

@Component({
  selector: 'rolap-compare-detail-view',
  templateUrl: './compare-detail-view.component.html',
  styleUrls: ['./compare-detail-view.component.scss'],
})
export class CompareDetailViewComponent implements OnChanges, OnDestroy {
  @Input() compare: MasterDetailTemplateData;
  public algorithmParams: RuleSetDetailsResponse['generation_params']['algorithm_params'];
  public currentName: string;
  private rulesetId: number;
  private datasetId: number;
  private projectId: number;
  private sub: Subscription;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private rulesetService: RuleSetApiService,
    private treeRefreshService: TreeviewRefreshService,
    private store: Store<AppState>,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['compare']) {
      this.currentName = this.compare.data.name;
      this.rulesetId = this.compare.data.id;
      this.setGenerateParams();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setGenerateParams() {
    this.sub?.unsubscribe();
    this.sub = this.store
      .select(selectCurrentV2TabIds)
      .pipe(
        switchMap((ids) => {
          if (!ids) return EMPTY;

          return this.rulesetService
            .getRulesetDetails(ids.dataSetId!, this.rulesetId)
            .pipe(map((res) => ({ res, ids })));
        }),
      )
      .subscribe((response) => {
        if (!response) return;
        const { res, ids } = response;
        this.datasetId = ids.dataSetId!;
        this.projectId = ids.projectId!;

        this.algorithmParams = res.generation_params.algorithm_params;
      });
  }

  public onEffectClick() {
    const ids: Ids = { projectId: this.projectId, dataSetId: this.datasetId, ruleSetId: this.rulesetId };

    this.treeRefreshService.openRuleSetTab(ids, this.compare.data.name);
  }
}
