import { Component, Input, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';

import { Store } from '@ngrx/store';

import { Modal } from '../../../../../common/services/modal/modal';
import { TableInstanceService } from '../../../../../common/services/table-instance/table-instance.service';
import { AppState, SubTabsNames } from '../../../../../common/store/app-state.model';
import { V2ClassifyCardActions } from '../../../../../common/store/v2Classify/v2Classify.action';
import { V2TabsActions } from '../../../../../common/store/v2Tabs/v2Tabs.action';
import { ContextMenuItemType } from '../../../dataset/models/dataset';

@Component({
  selector: 'rolap-ruleset-select-modal',
  templateUrl: './ruleset-select-modal.component.html',
  styleUrls: ['./ruleset-select-modal.component.scss'],
})
export class RulesetSelectModalComponent implements OnDestroy {
  @Input() dataSetId: number;
  @Input() ruleSets: any;
  @Input() type: ContextMenuItemType;
  @Input() selectedRows: any[];
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private modal: Modal<RulesetSelectModalComponent>,
    private tableInstanceService: TableInstanceService,
    private store: Store<AppState>,
  ) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public ruleClick(ruleSetId: number, ruleSetName: string) {
    this.tableInstanceService.openRulesetTab(this.dataSetId, ruleSetId, ruleSetName);
    if (this.type === 'classify') this.moveRule();
    this.modal.close();
  }

  private moveRule(): void {
    this.store.dispatch(V2ClassifyCardActions.addByContextMenu({ selectedRows: this.selectedRows }));
    this.store.dispatch(V2TabsActions.setCurrentSubTabIndexBySubTabName({ name: SubTabsNames.EXAMPLE }));
  }
}
