import { Component, Input, ViewChild } from '@angular/core';

import { faBallotCheck } from '@fortawesome/pro-solid-svg-icons';

import { DatasetViewTableComponent } from '../../../../common/components/data-grid/dataset-view-table/dataset-view-table.component';
import { DatasetViewTableType } from '../../../../common/components/data-grid/dataset-view-table/types';
import { Modal } from '../../../../common/services/modal/modal';

@Component({
  selector: 'rolap-project-example-select-modal',
  templateUrl: './project-example-select-modal.component.html',
  styleUrls: ['./project-example-select-modal.component.scss'],
})
export class ProjectExampleSelectModalComponent {
  @ViewChild(DatasetViewTableComponent) datasetViewTableComponent: DatasetViewTableComponent;
  @Input() dataSetId: number;
  @Input() projectId: number;
  @Input() ruleSetId: number;
  public readonly faBallotCheck = faBallotCheck;
  public readonly datasetViewTableType = DatasetViewTableType.RULE_SET_EXAMPLE_MODAL;
  private selectedRowData: any;

  constructor(private modal: Modal<ProjectExampleSelectModalComponent>) {}

  public selectionChanged(selectedRow: any): void {
    if (!selectedRow) return;
    this.selectedRowData = selectedRow;
  }

  public submit(): void {
    if (!this.selectedRowData) return;
    this.modal.close(this.selectedRowData);
  }

  public openColumnChooser(): void {
    this.datasetViewTableComponent?.openColumnChooser();
  }
}
