import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { nanoid } from 'nanoid';

import { ManualRuleSelectDataSetIds } from '../../models';

interface DatasetSelectionItem {
  name: string;
  id: number;
}

@Component({
  selector: 'rolap-manual-select-rule-dataset-selector',
  templateUrl: './manual-select-rule-dataset-selector.component.html',
  styleUrls: ['./manual-select-rule-dataset-selector.component.scss'],
})
export class ManualSelectRuleDatasetSelectorComponent implements OnChanges {
  @Input() dataSetIds: ManualRuleSelectDataSetIds;
  @Input() selectedDataSetId: number;
  @Output() selectedDataSetIdChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() datasetSelected: EventEmitter<number> = new EventEmitter<number>();

  public dataSetSelectionItems: DatasetSelectionItem[];
  public inputName: string = nanoid();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSetIds'] && this.dataSetIds) {
      this.setupDataSetSelectionItems();
    }
  }

  public onDataSetSelected() {
    this.selectedDataSetIdChange.emit(this.selectedDataSetId);
    this.datasetSelected.emit(this.selectedDataSetId);
  }

  private setupDataSetSelectionItems() {
    if (this.dataSetIds.current === this.dataSetIds.original) return;

    this.dataSetSelectionItems = [
      { name: 'project.rules.rules_manual_selection.current_dataset', id: this.dataSetIds.current },
      { name: 'project.rules.rules_manual_selection.original_dataset', id: this.dataSetIds.original },
    ];
  }
}
