import { Component, Input } from '@angular/core';

import { faGridRound, faLineColumns } from '@fortawesome/pro-solid-svg-icons';
import { ItemSelectionChangedEvent } from 'devextreme/ui/tree_view';

import { Modal } from '../../../../../../common/services/modal/modal';
import { MappedItem, TreeView } from '../../../../dataset/models/treeview';

@Component({
  selector: 'rolap-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent {
  @Input() treeView: TreeView;
  @Input() typeThatCanSelect: string = 'ruleSet';

  public faGridRound = faGridRound;
  public faLineColumns = faLineColumns;
  public selectedItem: MappedItem | null;

  constructor(private modal: Modal<TreeComponent>) {}

  public onTreeItemClick($event: ItemSelectionChangedEvent<MappedItem>): void {
    const itemData = $event.itemData as MappedItem;
    const canSelect = itemData.type === this.typeThatCanSelect;
    if (!canSelect) return;
    this.selectedItem = $event.itemData as MappedItem;
    this.modal.close({ selectedItem: this.selectedItem });
  }
}
