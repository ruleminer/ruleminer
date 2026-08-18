import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { filter, firstValueFrom, switchMap } from 'rxjs';

import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import DataSource from 'devextreme/data/data_source';

import { RowType } from '../../../common/interfaces/table.model';
import { ModalRef } from '../../../common/services/modal/modal-ref';
import { ModalService } from '../../../common/services/modal/modal.service';
import { defaultDevExtremePageSizes } from '../../../common/utils/dataGridUtils';
import { UserLimits } from '../../project/service/models/account.model';
import { ProjectService } from '../../project/service/project.service';
import { ProjectSummaryDeleteConfirmComponent } from '../project-summary-delete-confirm/project-summary-delete-confirm.component';
import { ProjectSummaryRefreshService } from '../services/project-summary-refresh/project-summary-refresh.service';

@Component({
  selector: 'rolap-project-summary-table',
  templateUrl: './project-summary-table.component.html',
  styleUrls: ['./project-summary-table.component.scss'],
})
export class ProjectSummaryTableComponent implements OnInit {
  @Input() userLimits: UserLimits;

  public dataSource: DataSource;
  public projectsToRemove: number[] = [];
  public faTrash = faTrash;
  public isLoading = true;
  public allowedPageSizes = defaultDevExtremePageSizes;

  private previouslyExpandedRow: number;

  private projectService = inject(ProjectService);
  private modalService = inject(ModalService);
  private translate = inject(TranslateService);
  private projectSummaryRefreshService = inject(ProjectSummaryRefreshService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.initializeDataSource();
    this.observeRefreshState();
  }

  public onRowClick(event: any) {
    const rowKey: number = event.key;

    if (this.previouslyExpandedRow !== rowKey || !event.isExpanded) {
      event.component.collapseRow(this.previouslyExpandedRow);
      event.component.expandRow(rowKey);
    } else {
      event.component.collapseRow(rowKey);
      event.component.deselectRows(rowKey);
    }

    this.previouslyExpandedRow = rowKey;
  }

  public onCellClick(event: any) {
    if (event.rowType === RowType.DATA && event.column.dataField === 'id') {
      // disable row expanding when clicked on remove checkbox
      event.event.stopImmediatePropagation();
    }
  }

  public onCheckBoxValueChanged(value: boolean, projectId: number) {
    const index = this.projectsToRemove.findIndex((x) => x === projectId);

    if (index === -1) return this.projectsToRemove.push(projectId);
    if (!value) return this.projectsToRemove.splice(index, 1);

    return;
  }

  public onRemoveProjectBtnClick() {
    this.modalService
      .open(ProjectSummaryDeleteConfirmComponent, 'project_summary.modal.remove_project.title', '400px', undefined, {
        content: this.translate.instant('project_summary.modal.remove_project.content'),
      })
      .pipe(
        switchMap((modalRef: ModalRef<ProjectSummaryDeleteConfirmComponent>) => {
          return modalRef.getResult().pipe(
            filter((res) => res === true),
            switchMap(() => this.projectService.deleteProjects(this.projectsToRemove)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.projectSummaryRefreshService.setRefreshState(true);
      });
  }

  private observeRefreshState() {
    this.projectSummaryRefreshService
      .getRefreshState()
      .pipe(
        filter((x) => x === true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.projectsToRemove = [];
        this.dataSource.reload();
      });
  }

  private initializeDataSource() {
    this.dataSource = new DataSource({
      load: async (loadOptions: any) => {
        this.isLoading = true;
        let sorting: string | null;

        if (loadOptions.sort) {
          const key = loadOptions.sort[0].selector;
          const sortDirection = loadOptions.sort[0].desc ? '-' : '';

          sorting = sortDirection + key;
        } else {
          sorting = null;
        }

        return firstValueFrom(this.projectService.getProjectsSummary(loadOptions.take, loadOptions.skip, sorting)).then(
          (res) => {
            this.projectSummaryRefreshService.setRefreshState(false);
            this.isLoading = false;

            return {
              data: res.results,
              totalCount: res.count,
            };
          },
        );
      },
    });
  }

  public navigateToProject(projectId: number): void {
    this.router.navigate(['/projects', projectId.toString()], {
      queryParamsHandling: 'preserve',
    });
  }
}
