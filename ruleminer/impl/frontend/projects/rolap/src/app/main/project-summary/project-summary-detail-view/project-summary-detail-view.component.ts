import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subject, filter, firstValueFrom, switchMap, takeUntil } from 'rxjs';

import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import DataSource from 'devextreme/data/data_source';

import { ModalRef } from '../../../common/services/modal/modal-ref';
import { ModalService } from '../../../common/services/modal/modal.service';
import { defaultDevExtremePageSizes } from '../../../common/utils/dataGridUtils';
import { UserLimits } from '../../project/service/models/account.model';
import { ProjectService } from '../../project/service/project.service';
import { ProjectSummaryDeleteConfirmComponent } from '../project-summary-delete-confirm/project-summary-delete-confirm.component';
import { ProjectSummaryRefreshService } from '../services/project-summary-refresh/project-summary-refresh.service';

@Component({
  selector: 'rolap-project-summary-detail-view',
  templateUrl: './project-summary-detail-view.component.html',
  styleUrls: ['./project-summary-detail-view.component.scss'],
})
export class ProjectSummaryDetailViewComponent implements OnInit, OnDestroy {
  @Input() projectId: number;
  @Input() userLimits: UserLimits;

  public dataSetsToRemove: number[] = [];
  public dataSource: DataSource;
  public faTrash = faTrash;
  public isLoading = true;
  public allowedPageSizes = defaultDevExtremePageSizes;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private projectService: ProjectService,
    private modalService: ModalService,
    private translate: TranslateService,
    private projectSummaryRefreshService: ProjectSummaryRefreshService,
  ) {}

  ngOnInit(): void {
    this.initializeDataSource();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onCheckBoxValueChanged(value: boolean, dataSetId: number) {
    const index = this.dataSetsToRemove.findIndex((x) => x === dataSetId);

    if (index === -1) return this.dataSetsToRemove.push(dataSetId);
    if (!value) return this.dataSetsToRemove.splice(index, 1);

    return;
  }

  public onRemoveDataSetBtnClick() {
    this.modalService
      .open(ProjectSummaryDeleteConfirmComponent, 'project_summary.modal.remove_dataset.title', '400px', undefined, {
        content: this.translate.instant('project_summary.modal.remove_dataset.content'),
      })
      .pipe(
        switchMap((modalRef: ModalRef<ProjectSummaryDeleteConfirmComponent>) => {
          return modalRef.getResult().pipe(
            filter((res) => res === true),
            switchMap(() => this.projectService.deleteDataSets(this.projectId, this.dataSetsToRemove)),
          );
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => {
        this.projectSummaryRefreshService.setRefreshState(true);
      });
  }

  private initializeDataSource() {
    this.dataSource = new DataSource({
      load: async (loadOptions: any) => {
        this.isLoading = true;
        return firstValueFrom(
          this.projectService.getProjectSummary(this.projectId, loadOptions.take, loadOptions.skip),
        ).then((res) => {
          this.isLoading = false;
          return {
            data: res.results,
            totalCount: res.count,
          };
        });
      },
    });
  }
}
