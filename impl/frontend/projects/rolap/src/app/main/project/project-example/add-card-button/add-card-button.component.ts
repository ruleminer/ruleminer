import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, filter, switchMap, take } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faDatabase } from '@fortawesome/pro-regular-svg-icons';
import { faDice, faTable } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule, DxDropDownButtonModule } from 'devextreme-angular';

import { ModalRef } from '../../../../common/services/modal/modal-ref';
import { ModalService } from '../../../../common/services/modal/modal.service';
import { AppState } from '../../../../common/store/app-state.model';
import { V2ClassifyCardActions } from '../../../../common/store/v2Classify/v2Classify.action';
import { selectClassifyCardsIds } from '../../../../common/store/v2Classify/v2Classify.selectors';
import { selectCurrentV2Tab } from '../../../../common/store/v2Tabs/v2Tabs.selectors';
import { ProjectExampleSelectModalComponent } from '../project-example-select-modal/project-example-select-modal.component';

export interface ActionItem {
  icon: IconDefinition;
  label: string;
  action: () => void;
}
@Component({
  selector: 'rolap-add-card-button',
  template: `
    <dx-drop-down-button
      text="{{ 'project.example.add_card' | translate }}"
      [items]="actionItems"
      [itemTemplate]="'dropdownItemTemplate'"
      [showArrowIcon]="true"
      [useSelectMode]="false"
      (onItemClick)="onDropdownItemClick($event)">
      <div class="dropdown-item" *dxTemplate="let data of 'dropdownItemTemplate'" [title]="data.label | translate">
        <fa-icon [icon]="data.icon" class="icon"></fa-icon>
        <span class="label">{{ data.label | translate }}</span>
      </div>
    </dx-drop-down-button>
  `,
  styleUrls: ['./add-card-button.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, DxButtonModule, DxDropDownButtonModule, TranslateModule],
})
export class AddCardButtonComponent {
  private modalService = inject(ModalService);
  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  public actionItems = [
    {
      icon: faDatabase,
      label: 'project.example.select_from_dataset',
      action: () => this.openSelectExampleModal(),
    },
    {
      icon: faDice,
      label: 'project.example.select_random',
      action: () => this.selectRandomExample(),
    },
    {
      icon: faTable,
      label: 'project.example.select_empty',
      action: () => this.createEmptyCard(),
    },
  ];

  public onDropdownItemClick(e: { itemData?: ActionItem }): void {
    if (e.itemData && e.itemData.action) {
      e.itemData.action();
    }
  }

  private openSelectExampleModal(): void {
    this.store
      .select(selectCurrentV2Tab)
      .pipe(
        take(1),
        switchMap((tab) => {
          if (!tab || !tab.ids || typeof tab.ids.dataSetId !== 'number') return EMPTY;
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
        this.store.dispatch(V2ClassifyCardActions.add());
        setTimeout(() => {
          this.store
            .select(selectClassifyCardsIds)
            .pipe(take(1))
            .subscribe((cardIds) => {
              if (!cardIds || cardIds.length === 0) return;
              const newCardId = cardIds[cardIds.length - 1];

              this.store.dispatch(
                V2ClassifyCardActions.setExampleTable({
                  exampleTable: [res],
                  key: newCardId,
                }),
              );
            });
        }, 100);
      });
  }

  private selectRandomExample(): void {
    this.store.dispatch(V2ClassifyCardActions.addRandomCard());
  }

  private createEmptyCard(): void {
    this.store.dispatch(V2ClassifyCardActions.addEmptyCard());
  }
}
