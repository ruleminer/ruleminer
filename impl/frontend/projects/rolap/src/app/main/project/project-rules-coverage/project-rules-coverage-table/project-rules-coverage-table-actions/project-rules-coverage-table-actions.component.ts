import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy } from '@angular/core';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import {
  Observable,
  Subject,
  catchError,
  concatMap,
  filter,
  forkJoin,
  map,
  of,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';

import { faFloppyDisk } from '@fortawesome/pro-solid-svg-icons';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dxDataGrid from 'devextreme/ui/data_grid';
import { ErrorResponse } from 'projects/rolap/src/app/common/interfaces/error-response.model';
import { ModalRef } from 'projects/rolap/src/app/common/services/modal/modal-ref';
import { ModalService } from 'projects/rolap/src/app/common/services/modal/modal.service';
import { NotifyService } from 'projects/rolap/src/app/common/services/notify/notify.service';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import { getCurrentTabFilteringRules } from 'projects/rolap/src/app/common/store/v2RulesCoverageTab/v2RulesCoverageTab.selectors';
import { V2RulesTableMeta } from 'projects/rolap/src/app/common/store/v2RulesTable/types';
import { selectCurrentV2TabDescription } from 'projects/rolap/src/app/common/store/v2Tabs/v2Tabs.selectors';
import { Exporter } from 'projects/rolap/src/app/common/utils/exportUtils';

import { ExportItem } from '../../../../../common/components/buttons/export-dropdown/export-dropdown.component';
import { ProjectActions } from '../../../../../common/store/project/project.action';
import { ProblemTypes } from '../../../../data-upload/utils/enums';
import { getFileName } from '../../../../data-upload/utils/utils';
import { DatasetViewModalComponent } from '../../../dataset-view/dataset-view-modal/dataset-view-modal/dataset-view-modal.component';
import { DatasetService } from '../../../dataset/service/dataset.service';
import { DownloadService } from '../../../dataset/service/download.service';
import { TreeviewRefreshService } from '../../../dataset/treeview/service/treeview-refresh.service';
import { ExportType } from '../../../project-rules/project-rules-table/models/export-type';
import { ProjectService } from '../../../service/project.service';

@Component({
  selector: 'rolap-project-rules-coverage-table-actions',
  templateUrl: './project-rules-coverage-table-actions.component.html',
  styleUrls: ['./project-rules-coverage-table-actions.component.scss'],
})
export class ProjectRulesCoverageTableActionsComponent extends Exporter implements OnDestroy {
  @Input() dataGrid: dxDataGrid | null;
  @Input() ruleset: { meta: V2RulesTableMeta; rules: any[] };
  @Input() dataSetId: number;
  @Input() projectId: number;
  @Input() ruleSetId: number;
  @Input() problemType: ProblemTypes;

  public faFloppyDisk = faFloppyDisk;
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

  private readonly HANDLED_ERRORS = ['invalid_label_column_values'];
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private downloadService: DownloadService,
    private store: Store<AppState>,
    private modalService: ModalService,
    private datasetService: DatasetService,
    private projectService: ProjectService,
    private treeViewRefreshService: TreeviewRefreshService,
    private notifyService: NotifyService,
    private translate: TranslateService,
  ) {
    super();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public openSaveModal(): void {
    this.modalService
      .open(DatasetViewModalComponent, 'dataset.dataset_modal.title', '500px', undefined)
      .pipe(
        concatMap((modalRef: ModalRef<DatasetViewModalComponent>) =>
          modalRef.getResult<{ dataSetName: string | null }>(),
        ),
        filter((res) => res !== undefined),
        take(1),
        switchMap((res) =>
          this.store.select(getCurrentTabFilteringRules).pipe(
            filterOutNullish(),
            take(1),
            map((getVisibilityFilter) => {
              return { getVisibilityFilter, res };
            }),
          ),
        ),
        switchMap(({ res, getVisibilityFilter }) => {
          const newName = res.dataSetName;
          const filteredRuleSet = this.filterRuleset(this.ruleset, getVisibilityFilter);
          return this.datasetService.postRulesModify(newName!, this.dataSetId!, filteredRuleSet).pipe(
            map((res) => {
              return { dataSetId: res.dataset_id, name: newName };
            }),
            take(1),
            switchMap((res) =>
              this.store.pipe(select(selectCurrentV2TabDescription)).pipe(
                take(1),
                map((description) => {
                  if (!res || !res.name) return null;
                  return {
                    ...res,
                    name: res.name,
                    description: description,
                  };
                }),
              ),
            ),
            takeUntil(this.ngUnsubscribe),
          );
        }),
        catchError((err) => this.handleSaveDatasetError(err)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((res) => {
        if (!res) return;
        this.handleSaveDatasetSuccess(res);
      });
  }

  private filterRuleset(ruleset: any, getVisibilityFilter: any[]): any {
    if (!getVisibilityFilter || getVisibilityFilter.length === 0) return ruleset;

    const rulesToFilterDataset: Set<string> = new Set();
    getVisibilityFilter.forEach((e) => rulesToFilterDataset.add(e.uuid));
    return {
      meta: ruleset.meta,
      rules: ruleset.rules.filter((rule: any) => rulesToFilterDataset.has(rule.uuid)),
    };
  }

  private openSavedDataset(dataSetId: number, name: string, description: string): void {
    const ids: Ids = {
      projectId: this.projectId,
      ruleSetId: undefined,
      dataSetId: dataSetId,
    };
    const isNewProject = false;
    this.projectService.openUploadSuccessModal(ids, isNewProject, name, description, 'dataSet');
  }

  private handleSaveDatasetError(httpError: HttpErrorResponse): Observable<null> {
    const errorCode = (httpError.error as ErrorResponse).err_msg_id;

    // propagate higher up to the global error handler
    if (!errorCode || !this.HANDLED_ERRORS.includes(errorCode)) throw httpError;

    // this errors requires different user messages for different project problem types
    this.notifyService.showNotify(
      this.translate.instant(`toast_messages.errors.server_messages.${errorCode}.${this.problemType}`),
      'error',
    );
    this.store.dispatch(ProjectActions.signalTreeDataRefresh());
    return of(null);
  }

  private handleSaveDatasetSuccess(res: { name: string; description: string | undefined; dataSetId: number }): void {
    this.store.dispatch(ProjectActions.signalTreeDataRefresh());
    this.notifyService.showNotify(this.translate.instant('project.rules.save_modal.save_success_dataset'), 'success');
    const description = res.description ? res.description : '';
    this.openSavedDataset(res.dataSetId, res.name, description);
  }

  private exportCombined(format: ExportType) {
    this.store
      .select(getCurrentTabFilteringRules)
      .pipe(
        filterOutNullish(),
        take(1),
        switchMap((visibilityFilter) => {
          const filteredRuleSet = this.filterRuleset(this.ruleset, visibilityFilter);
          const downloadDatasetFilteredByRules = this.downloadService.downloadDatasetFilteredByRules(
            format,
            this.dataSetId!,
            filteredRuleSet,
          );
          const downloadRulesetExampleCoverage = this.downloadService.downloadRulesetExampleCoverage(
            format,
            this.ruleSetId!,
            filteredRuleSet,
          );
          return forkJoin({ downloadDatasetFilteredByRules, downloadRulesetExampleCoverage });
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((result) => {
        const datasetFilteredByRules = result.downloadDatasetFilteredByRules.headers.get('Content-Disposition');
        const exambleCoverageName = result.downloadRulesetExampleCoverage.headers.get('Content-Disposition');
        Exporter.exportBlobCsv(result.downloadDatasetFilteredByRules.body, getFileName(datasetFilteredByRules));
        Exporter.exportBlobCsv(result.downloadRulesetExampleCoverage.body, getFileName(exambleCoverageName));
      });
  }
}
