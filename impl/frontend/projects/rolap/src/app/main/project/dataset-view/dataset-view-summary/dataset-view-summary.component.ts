import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
 
import { EMPTY, Observable, catchError, concatMap, filter, map, switchMap, take } from 'rxjs';
import { filterOutNullish } from '../../../../common/utils/rxjsUtils';
 
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFloppyDisk } from '@fortawesome/pro-solid-svg-icons';
import { Store, select } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent } from 'devextreme-angular';
 
import {
  ExportDropdownComponent,
  ExportItem,
} from '../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { TitleComponent } from '../../../../common/components/title/title.component';
import { ErrorResponse } from '../../../../common/interfaces/error-response.model';
import { ModalRef } from '../../../../common/services/modal/modal-ref';
import { ModalService } from '../../../../common/services/modal/modal.service';
import { NotifyService } from '../../../../common/services/notify/notify.service';
import { AppState, SubTabsNames } from '../../../../common/store/app-state.model';
import { ProjectActions } from '../../../../common/store/project/project.action';
import { activeProjectProblemTypeSelector } from '../../../../common/store/project/project.selectors';
import { Ids } from '../../../../common/store/ruleSets/rulesets.selectors';
import {
  getCurrentV2DataSetTableColumns,
  getCurrentV2DataSetTableFilterState,
  getCurrentV2DataSetTableFilteredCount,
} from '../../../../common/store/v2DataSetTable/v2DataSetTable.selectors';
import { selectCurrentV2TabDescription, selectCurrentV2TabIds } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { Exporter } from '../../../../common/utils/exportUtils';
import { getFileName } from '../../../data-upload/utils/utils';
import { DatasetService } from '../../dataset/service/dataset.service';
import { DownloadService } from '../../dataset/service/download.service';
import { TreeviewRefreshService } from '../../dataset/treeview/service/treeview-refresh.service';
import { RulesTableColumnChooserButtonComponent } from '../../project-rules/project-rules-table/buttons/rules-table-column-chooser-button/rules-table-column-chooser-button.component';
import { ExportType } from '../../project-rules/project-rules-table/models/export-type';
import { ProjectService } from '../../service/project.service';
import { DatasetSummaryComponent } from '../dataset-summary/dataset-summary.component';
import { DatasetViewModalComponent } from '../dataset-view-modal/dataset-view-modal/dataset-view-modal.component';
 
@Component({
  selector: 'rolap-dataset-view-summary',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    DatasetSummaryComponent,
    ExportDropdownComponent,
    RulesTableColumnChooserButtonComponent,
    TitleComponent,
  ],
  styleUrls: ['./dataset-view-summary.component.scss'],
  templateUrl: './dataset-view-summary.component.html',
})
export class DatasetViewSummaryComponent implements OnChanges {
  private readonly INVALID_LABELS_VALUES_ERROR_CODE = 'invalid_label_column_values';
  @Input() dataGrid: DxDataGridComponent;
  private store = inject(Store<AppState>);
  private safeDataGrid: DxDataGridComponent | null = null;
 
  public filteredCount$ = this.store.select(getCurrentV2DataSetTableFilteredCount);
  public filteredState$ = this.store.select(getCurrentV2DataSetTableFilterState).pipe(
    filterOutNullish(),
    map((state) => ({
      sort: state.sort,
      filter: state.filter,
    })),
  );
 
  public savedColumns$ = this.store.select(getCurrentV2DataSetTableColumns);
 
  public faFloppyDisk = faFloppyDisk;
  public displayType = SubTabsNames.DATASET;
  private treeViewRefreshService = inject(TreeviewRefreshService);
  private modalService = inject(ModalService);
  private datasetService = inject(DatasetService);
  private destroyRef = inject(DestroyRef);
  private projectService = inject(ProjectService);
  private translate = inject(TranslateService);
  private downloadService = inject(DownloadService);
  private notifyService = inject(NotifyService);
 
  public idsSignal = this.store.selectSignal(selectCurrentV2TabIds);
  public problemTypeSignal = this.store.selectSignal(activeProjectProblemTypeSelector);
 
  public exportItems: ExportItem[] = [
    {
      text: ExportType.CSV,
      onClick: () => this.exportCombined(ExportType.CSV),
    },
    {
      text: ExportType.XLSX,
      onClick: () => this.exportCombined(ExportType.XLSX),
    },
  ];
 
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataGrid'] && changes['dataGrid'].currentValue) {
      this.safeDataGrid = changes['dataGrid'].currentValue;
    }
  }
 
  public openSaveModal(): void {
    if (!this.safeDataGrid) return;
 
    this.modalService
      .open(DatasetViewModalComponent, 'dataset.dataset_modal.title', '500px', undefined)
      .pipe(
        concatMap((modalRef: ModalRef<DatasetViewModalComponent>) =>
          modalRef.getResult<{ dataSetName: string | null }>(),
        ),
        filter((res) => res !== undefined),
        take(1),
        concatMap((res) => {
          const newName = res.dataSetName;
          if (!newName) return EMPTY;
 
          return this.filteredState$.pipe(
            take(1),
            concatMap(({ filter, sort }) => {
              if (!this.safeDataGrid) return EMPTY;
 
              const columns = this.safeDataGrid.instance.getVisibleColumns();
              const ids = this.idsSignal();
              if (!ids) return EMPTY;
 
              const columnNames = columns
                .filter((column) => column.dataField !== '#')
                .map((column) => column.dataField as string);
 
              const sortConfig = sort || [];
              return this.datasetService
                .saveFilterDataset(ids.dataSetId!, newName, sortConfig, filter, columnNames)
                .pipe(
                  map((response) => ({
                    dataSetId: response.dataset_id,
                    name: newName as string,
                    description: undefined,
                  })),
                );
            }),
          );
        }),
        switchMap((res) =>
          this.store.pipe(select(selectCurrentV2TabDescription)).pipe(
            take(1),
            map((description) => {
              if (!res) return null;
              return {
                ...res,
                description: description,
              };
            }),
          ),
        ),
        catchError((err) => this.handleSaveDatasetError(err)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.handleSaveDatasetSuccess(res);
        },
        error: () => {
          const problemType = this.problemTypeSignal();
          this.notifyService.showNotify(
            this.translate.instant(`toast_messages.errors.server_messages.invalid_label_column_values.${problemType}`),
            'error',
          );
        },
      });
  }
 
  private handleSaveDatasetSuccess(res: { name: string; description: string | undefined; dataSetId: number }): void {
    this.store.dispatch(ProjectActions.signalTreeDataRefresh());
    this.notifyService.showNotify(this.translate.instant('project.rules.save_modal.save_success_dataset'), 'success');
    const description = res.description ? res.description : '';
    this.openSavedDataset(res.dataSetId, res.name, description);
  }
 
  private openSavedDataset(dataSetId: number, name: string, description: string): void {
    const idsSignal = this.idsSignal();
    if (!idsSignal) return;
    const ids: Ids = {
      projectId: idsSignal.projectId,
      ruleSetId: undefined,
      dataSetId: dataSetId,
    };
    const isNewProject = false;
    this.projectService.openUploadSuccessModal(ids, isNewProject, name, description, 'dataSet');
  }
 
  private exportCombined(format: ExportType) {
    const ids = this.idsSignal();
    if (!ids || !this.safeDataGrid) return;
 
    this.filteredState$
      .pipe(
        take(1),
        concatMap(({ filter }) => {
          const columns = this.safeDataGrid?.instance.getVisibleColumns()
            .filter((column) => column.dataField !== '#')
            .map((column) => column.dataField as string);
          return this.downloadService.downloadDataset(ids.dataSetId!, format, filter, columns);
        }),
        take(1),
        catchError((httpError) => {
          const errorResponse = httpError.error as ErrorResponse & { detail: { limit: number } };
          this.notifyService.showNotify(
            this.translate.instant('toast_messages.errors.server_messages.datasets_limit_reached', {
              limit: String(errorResponse.detail.limit),
            }),
            'error',
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        const name = data.headers.get('Content-Disposition');
        Exporter.exportBlobCsv(data.body, getFileName(name));
      });
  }
 
  private handleSaveDatasetError(httpError: HttpErrorResponse): Observable<null> {
    const errorCode = (httpError.error as ErrorResponse).err_msg_id;
 
    if (!errorCode) throw httpError;
 
    return this.store.select(activeProjectProblemTypeSelector).pipe(
      take(1),
      map((problemType) => {
        const baseErrorMessage = this.translate.instant(
          `toast_messages.errors.server_messages.invalid_label_column_values.${problemType}`,
        );
        this.notifyService.showNotify(baseErrorMessage, 'error');
        this.store.dispatch(ProjectActions.signalTreeDataRefresh());
        return null;
      }),
    );
  }
}