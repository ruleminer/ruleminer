import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { MappedItem } from '../../dataset/models/treeview';
import { TreeviewRefreshService } from '../../dataset/treeview/service/treeview-refresh.service';
import { ProcessDetails } from '../models/process.model';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../common/store/app-state.model';
import { selectTreeData } from '../../../../common/store/project/project.selectors';
import { filterOutNullish } from '../../../../common/utils/rxjsUtils';

@Component({
  selector: 'rolap-process-data-set',
  templateUrl: './process-data-set.component.html',
  styleUrls: ['./process-data-set.component.scss'],
})
export class ProcessDataSetComponent implements OnInit, OnDestroy {
  @Input() processDetails: ProcessDetails;

  public projectName: string = '';
  public dataSetData: MappedItem;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private treeRefreshService: TreeviewRefreshService, private store: Store<AppState>) {}

  ngOnInit(): void {
    if (this.processDetails.source_content_type === 'dataset') {
      this.getDatasetName();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Open data set tab.
   */
  public onDataSetClick() {
    this.treeRefreshService.openDataSetTab(this.dataSetData.ids, this.dataSetData.text);
  }

  private getDatasetName() {
    this.store.select(selectTreeData)
      .pipe(
        filterOutNullish(),
        takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const projectIndex = res.findIndex((x) => +x.id === this.processDetails.project);
        if (projectIndex === -1) return;

        this.findDataSet(res[projectIndex].items);
      });
  }

  /**
   * Find data set object in tree view data.
   *
   * @param dataSets - list of data sets in project
   */
  private findDataSet(dataSets: MappedItem[] | undefined) {
    if (!dataSets) return;

    const index = dataSets.findIndex(
      (x) =>
        x.ids.projectId === this.processDetails.project &&
        x.ids.dataSetId === this.processDetails.source_object_id &&
        x.type === 'dataSet',
    );

    if (index > -1) {
      this.dataSetData = dataSets[index];
    }
  }
}
