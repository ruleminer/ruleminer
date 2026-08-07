import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, filter, switchMap, take } from 'rxjs';

import { Store } from '@ngrx/store';

import { ModalRef } from '../../../../../common/services/modal/modal-ref';
import { ModalService } from '../../../../../common/services/modal/modal.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { V2ClassifyCardActions } from '../../../../../common/store/v2Classify/v2Classify.action';
import { selectCurrentV2Tab } from '../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { ProjectExampleSelectModalComponent } from '../../project-example-select-modal/project-example-select-modal.component';

@Component({
  selector: 'rolap-project-example-item-select-btn',
  templateUrl: './project-example-item-select-btn.component.html',
  styleUrls: ['./project-example-item-select-btn.component.scss'],
})
export class ProjectExampleItemSelectBtnComponent {
  @Input() cardKey: string;

  private modalService = inject(ModalService);
  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  public openSelectExampleModal(): void {
    this.store
      .select(selectCurrentV2Tab)
      .pipe(
        take(1),
        switchMap((tab) => {
          if (!tab) return EMPTY;
          return this.modalService
            .open(ProjectExampleSelectModalComponent, null, '100%', '100%', { dataSetId: tab.ids.dataSetId })
            .pipe(
              switchMap((modalRef: ModalRef<ProjectExampleSelectModalComponent>) =>
                modalRef.getResult().pipe(filter((res) => res !== undefined)),
              ),
              takeUntilDestroyed(this.destroyRef),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
        take(1),
      )
      .subscribe((res) => {
        if (!res) return;
        this.setExampleTable(res);
      });
  }

  private setExampleTable(rowData: any): void {
    this.store.dispatch(
      V2ClassifyCardActions.setExampleTable({
        exampleTable: [rowData],
        key: this.cardKey,
      }),
    );
  }
}
