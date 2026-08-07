import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, filter, map, switchMap } from 'rxjs';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';

import { ModalRef } from '../../../../../common/services/modal/modal-ref';
import { ModalPositions, ModalService } from '../../../../../common/services/modal/modal.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { mainLimitsSelector } from '../../../../../common/store/limits/limits.selector';
import { Ids } from '../../../../../common/store/ruleSets/rulesets.selectors';
import { sidebarWidthSelector } from '../../../../../common/store/sidebar/sidebar.reducer';
import { UploadStepperModalComponent } from '../../../../data-upload/upload-stepper-modal/upload-stepper-modal.component';
import { ProjectService } from '../../../service/project.service';
import { ProjectActions } from '../../../../../common/store/project/project.action';
import { selectNumberOfDatasetsInTree } from '../../../../../common/store/project/project.selectors';
import { TabsActions } from '../../../../../common/store/ruleSets/tabs.action';
import { V2CurrentTabAction } from '../../../../../common/store/v2CurrentTab/v2CurrentTab.action';

@Component({
  selector: 'rolap-tree-footer',
  templateUrl: './tree-footer.component.html',
  styleUrls: ['./tree-footer.component.scss'],
})
export class TreeFooterComponent {
  private modalService = inject(ModalService);
  private projectService = inject(ProjectService);
  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  public readonly faIconPlus = faPlus;
  public readonly isReachedLimitSignal = toSignal(combineLatest([
    this.store.select(selectNumberOfDatasetsInTree),
    this.store.select(mainLimitsSelector)
  ]).pipe(
    filter(([_, limits]) => !!limits),
    map(([numberOfDatasets, limits]) => {
      return limits && limits.max_datasets && numberOfDatasets >= limits.max_datasets
    }
    )
  ), { initialValue: true });
  public showText$ = this.store.select(sidebarWidthSelector).pipe(
    map((width) => width > 100),
    takeUntilDestroyed(this.destroyRef),
  );

  public openProcessTab(): void {
    this.store.dispatch(TabsActions.addProcess());
    this.store.dispatch(V2CurrentTabAction.setCurrentTab({ currentTab: 'process' }))
  }

  public openFileImporterModal(): void {
    this.modalService
      .open(
        UploadStepperModalComponent,
        'project.new_project',
        '100%',
        '100%',
        {
          isNewProject: false,
        },
        {
          closeOnBackdropClick: true,
          position: ModalPositions.BOTTOM,
          closeOnEscapeClick: false,
        },
        null,
        false,
      )
      .pipe(
        switchMap((modalRef: ModalRef<UploadStepperModalComponent>) =>
          modalRef.getResult().pipe(filter((res) => res !== undefined)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (!res) return;
        this.store.dispatch(ProjectActions.signalTreeDataRefresh());
        this.openUploadedDataset(res);
      });
  }

  private openUploadedDataset(res: any) {
    if (!res) return;
    const ids: Ids = {
      projectId: res.mappedData.project_id,
      ruleSetId: undefined,
      dataSetId: res.mappedData.dataset_id,
    };
    const name = res.mappedData.name;
    const description = res.mappedData.description;
    const isNewProject = res.isNewProject || false;
    this.projectService.openUploadSuccessModal(ids, isNewProject, name, description);
  }

}
