import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MappedItem } from '../../dataset/models/treeview';
import { TreeviewRefreshService } from '../../dataset/treeview/service/treeview-refresh.service';
import { ProcessDetails } from '../models/process.model';
import { selectTreeData } from '../../../../common/store/project/project.selectors';
import { AppState } from '../../../../common/store/app-state.model';
import { Store } from '@ngrx/store';
import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
import { ProcessService } from '../../../../common/services/processes/process.service';

export type DataGroup = 'rulesets_group' | 'reports_group';

@Component({
  selector: 'rolap-project-effect',
  templateUrl: './project-effect.component.html',
  styleUrls: ['./project-effect.component.scss'],
})
export class ProjectEffectComponent implements OnInit {
  @Input() processDetails: ProcessDetails;
  public treeViewData: MappedItem[];
  public effectData: MappedItem;

  private treeRefreshService = inject(TreeviewRefreshService);
  private processService = inject(ProcessService);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store<AppState>);

  ngOnInit() {
    this.setupData();
  }

  /**
   * Open ruleset or report tab.
   */
  public onEffectClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.processDetails.result_content_type === 'ruleset') {
      this.treeRefreshService.openRuleSetTab(this.effectData.ids, this.effectData.text);
    } else if (this.processDetails.result_content_type === 'report') {
      this.treeRefreshService.openReportTab(this.effectData.ids, this.effectData.id, this.effectData.text);
    }
  }

  /**
   * Get project data.
   */
  private getProject() {
    const index = this.treeViewData.findIndex((x) => +x.id === this.processDetails.project);

    if (index <= -1) return;
    return this.treeViewData[index];
  }

  /**
   * Get ruleset or report data.
   * Searches for a dataset in the project data, and then searches for a rule set or report in the dataset.
   *
   * @param projectData
   * @param type
   */
  private getEffectData(projectData: MappedItem, type: DataGroup) {
    if (this.processDetails.source_content_type !== 'dataset') return;

    const dataSet = this.processService.getDataSet(projectData, this.processDetails);

    if (!dataSet) return;

    const groupData = this.processService.getDataGroup(dataSet, type);

    const index = groupData?.dataGroup.items?.findIndex((x) => {
      const isReport = x.ids.hasOwnProperty('reportId');

      if (isReport) {
        // find report
        return (
          x.ids.projectId === this.processDetails.project &&
          x.ids.dataSetId === this.processDetails.source_object_id &&
          x.ids.reportId === this.processDetails.result_object_id
        );
      } else {
        // find ruleset
        return (
          x.ids.projectId === this.processDetails.project &&
          x.ids.dataSetId === this.processDetails.source_object_id &&
          x.ids.ruleSetId === this.processDetails.result_object_id
        );
      }
    });

    if (groupData && index !== undefined && index > -1) {
      this.effectData = groupData.dataGroup.items![index];
    }
  }

  private setupData() {
    this.store.select(selectTreeData).pipe(
      filterOutNullish(),
      takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.treeViewData = res;
        const project = this.getProject();

        if (!project) return;

        if (this.processDetails.result_content_type === 'ruleset') this.getEffectData(project, 'rulesets_group');
        else if (this.processDetails.result_content_type === 'report') this.getEffectData(project, 'reports_group');
      });
  }
}
