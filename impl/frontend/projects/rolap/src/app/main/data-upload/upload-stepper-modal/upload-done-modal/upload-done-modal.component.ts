import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { Modal } from '../../../../common/services/modal/modal';
import { Ids } from '../../../../common/store/ruleSets/rulesets.selectors';
import { TreeviewRefreshService } from '../../../project/dataset/treeview/service/treeview-refresh.service';

@Component({
  selector: 'rolap-upload-done-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, DxButtonModule],
  templateUrl: './upload-done-modal.component.html',
  styleUrls: ['./upload-done-modal.component.scss'],
})
export class UploadDoneModalComponent {
  @Input() description: string;
  @Input() ids: Ids;
  @Input() isNewProject: boolean;
  @Input() name: string;
  @Input() type: 'ruleSet' | 'dataSet' = 'dataSet';

  constructor(private modal: Modal<UploadDoneModalComponent>, private treeRefreshService: TreeviewRefreshService) {}

  public cancel(): void {
    this.modal.close();
  }

  public confirm(): void {
    this.openInNewTab();
  }

  private openInNewTab(): void {
    if (this.type === 'dataSet') return this.openDataSet();
    this.openRuleSet();
  }

  private openDataSet(): void {
    this.treeRefreshService.openDataSetTab(this.ids, this.name, this.description);
    this.modal.close();
  }

  private openRuleSet(): void {
    this.treeRefreshService.openRuleSetTab(this.ids, this.name, this.description);
    this.modal.close();
  }
}
