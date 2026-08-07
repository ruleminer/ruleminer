import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subject, takeUntil } from 'rxjs';

import { faGridRound, faLineColumns } from '@fortawesome/pro-solid-svg-icons';
import { DxTextBoxComponent } from 'devextreme-angular';
import { ItemSelectionChangedEvent } from 'devextreme/ui/tree_view';
import { isEqual } from 'lodash';
import { ModalService } from 'projects/rolap/src/app/common/services/modal/modal.service';

import { FieldName } from '../../../../../common/components/validation-message/validation-message.component';
import { Modal } from '../../../../../common/services/modal/modal';
import { RuleSetApiService } from '../../../../../common/services/rule-set/rule-set-api.service';
import { isRuleSet } from '../../../../../common/store/v2Tabs/utils';
import { CustomTitleRuleSetValidation } from '../../../../data-upload/utils/formValidators';
import { getLocalDateTime } from '../../../../data-upload/utils/utils';
import { MappedItem, TreeView } from '../../../dataset/models/treeview';
import { TreeviewRefreshService } from '../../../dataset/treeview/service/treeview-refresh.service';
import { CopyRulesetRequest } from '../../../models/ruleset';
import { ProcessTabInfoComponent } from '../../../process/process-tab-info/process-tab-info.component';
import { ProjectActions } from '../../../../../common/store/project/project.action';
import { AppState } from '../../../../../common/store/app-state.model';
import { Store } from '@ngrx/store';

@Component({
  selector: 'rolap-add-ruleset-modal',
  templateUrl: './add-ruleset-modal.component.html',
  styleUrls: ['./add-ruleset-modal.component.scss'],
})
export class AddRulesetModalComponent implements OnInit, OnDestroy {
  @ViewChild('textBox') textBox: DxTextBoxComponent;
  @Input() dataSetId: number;
  @Input() projectId: number;
  @Input() name: string;
  public faGridRound = faGridRound;
  public faLineColumns = faLineColumns;
  public treeView: TreeView;
  public selectedItem: MappedItem | null;
  public form: FormGroup;
  public componentReady = false;
  public FieldName = FieldName;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private modal: Modal<AddRulesetModalComponent>,
    private modalService: ModalService,
    private fb: FormBuilder,
    private ruleSetService: RuleSetApiService,
    private treeRefreshService: TreeviewRefreshService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.setUpForm();

    this.treeRefreshService
      .getTreeItemsOnlyRulesetsWithDatasetAttributes(this.projectId, this.dataSetId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({ treeView, matchingDatasets }) => {
        this.treeView = treeView;
        this.filterMatchingDatasetFromTreeData(matchingDatasets);
        this.componentReady = true;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onSubmitClick(): void {
    if (!this.selectedItem) return;
    const { name } = this.form.value;
    const ids = this.selectedItem.ids;
    const generatedFromProjectId = ids.projectId;
    const generatedFromDatasetId = ids.dataSetId;
    const generatedFromRuleSetId = ids.ruleSetId;

    if (!generatedFromDatasetId || !generatedFromRuleSetId || !generatedFromProjectId) return;

    const body: CopyRulesetRequest = {
      name: name,
      description: name,
    };
    this.ruleSetService
      .copyRuleSet(Number(generatedFromRuleSetId), this.dataSetId, body)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.store.dispatch(ProjectActions.signalTreeDataRefresh());
          this.modal.close();
          this.openProcessListModal();
        },
        error: () => {
          this.modal.close();
        },
      });
  }

  public onTreeItemClick($event: ItemSelectionChangedEvent<MappedItem>): void {
    const itemData = $event.itemData as MappedItem;
    if (!itemData.type) return;
    if (!isRuleSet(itemData.type)) return;
    this.selectedItem = isEqual(itemData.ids, this.selectedItem) ? (this.selectedItem = null) : itemData;
  }

  public onCancelClick(): void {
    this.modal.close();
  }

  public onInitialized() {
    // setTimeout is used for focusing on the textBox control due to Devexpress requirements.
    setTimeout(() => {
      this.textBox.instance.focus();
    }, 0);
  }

  //TODO: Check if we could use filterMatchingDatasetFromTreeData from the service instead of this one
  private filterMatchingDatasetFromTreeData(matchingDatasets: { id: number; name: string }[]): void {
    const itemsToStayMap = new Map();
    matchingDatasets.forEach((e) => {
      itemsToStayMap.set(e.id, e);
    });

    this.treeView.forEach((rootElement, index) => {
      this.treeView[index].items = rootElement.items?.filter((item) => itemsToStayMap.has(item.ids.dataSetId));
    });

    this.treeView.forEach((rootElement) => {
      rootElement.items = rootElement.items?.filter((item: any) => item.items && item.items!.length! > 0);
    });
  }

  private openProcessListModal(): void {
    this.modalService.open(ProcessTabInfoComponent, 'process.info_modal.title', '400px', undefined, {
      projectId: this.projectId,
      contentTranslateKey: 'process.info_modal.content.add_existing_ruleset_process_started',
    });
  }

  private setUpForm(): void {
    this.form = this.fb.group({
      name: [`${this.name}_${getLocalDateTime()}`, CustomTitleRuleSetValidation],
    });
  }
}
