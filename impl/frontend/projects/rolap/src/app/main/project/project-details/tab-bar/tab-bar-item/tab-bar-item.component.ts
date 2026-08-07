import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { Subject, Subscription, switchMap, takeUntil } from 'rxjs';

import { faChartNetwork, faChartPie, faLineColumns, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { ModalRef } from '../../../../../common/services/modal/modal-ref';
import { ModalService } from '../../../../../common/services/modal/modal.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { TabsActions } from '../../../../../common/store/ruleSets/tabs.action';
import { V2CurrentTabAction } from '../../../../../common/store/v2CurrentTab/v2CurrentTab.action';
import { V2Tab } from '../../../../../common/store/v2Tabs/types';
import { RolapItemTypes } from '../../../../../common/store/v2Tabs/utils';
import { NotSavedModalComponent } from '../../modals/not-saved-modal/not-saved-modal.component';
import { MAX_TAB_TEXT_LENGTH } from '../utils';

export type Item = {
  id: string;
  text: string;
  isLongText: boolean;
  htmlID: string;
  isCurrent: boolean;
  isSaved: boolean;
  type?: RolapItemTypes;
};

@Component({
  selector: 'rolap-tab-bar-item',
  templateUrl: './tab-bar-item.component.html',
  styleUrls: ['./tab-bar-item.component.scss'],
})
export class TabBarItemComponent implements OnChanges, OnDestroy {
  @Input() v2CurrentTabId: string;
  @Input() v2Tab: V2Tab;
  @Input() last: boolean;
  public faTimes = faTimes;
  public item: Item;
  public faChartNetwork = faChartNetwork;
  public faLineColumns = faLineColumns;
  public faChartPie = faChartPie;
  private langChangeSubscription: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private store: Store<AppState>,
    private translateService: TranslateService,
    private modalService: ModalService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['v2Tab'] || changes['v2CurrentTabId']) this.setItem();
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public setCurrentTab(): void {
    this.store.dispatch(V2CurrentTabAction.setCurrentTab({ currentTab: this.v2Tab.id }));
  }

  private setItem(): void {
    if (this.v2Tab.id === 'process') {
      this.setProcessItem();
      this.langChangeSubscription?.unsubscribe();
      this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
        this.setProcessItem();
      });
      return;
    }
    if (this.v2Tab.type === 'compare') {
      this.setCompareItem();
      this.langChangeSubscription?.unsubscribe();
      this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
        this.setCompareItem();
      });
      return;
    }

    const text = this.v2Tab.text;
    this.item = {
      id: this.v2Tab.id,
      text: text,
      isLongText: text.length > MAX_TAB_TEXT_LENGTH,
      htmlID: `tab-${this.v2Tab.id}`,
      isCurrent: this.v2CurrentTabId === this.v2Tab.id,
      isSaved: this.v2Tab.isSaved,
      type: this.v2Tab.type,
    };
  }

  private setProcessItem(): void {
    const text = this.translateService.instant('project.treeview.process');
    this.item = {
      id: 'process',
      text,
      isLongText: text.length > MAX_TAB_TEXT_LENGTH,
      htmlID: `tab-process`,
      isCurrent: this.v2CurrentTabId === 'process',
      isSaved: this.v2Tab.isSaved,
      type: 'process',
    };
  }

  private setCompareItem(): void {
    const text = this.translateService.instant('project.treeview.context_menu.button.compare');
    this.item = {
      id: this.v2Tab.id,
      text,
      isLongText: text.length > MAX_TAB_TEXT_LENGTH,
      htmlID: `tab-${this.v2Tab.id}`,
      isCurrent: this.v2CurrentTabId === this.v2Tab.id,
      isSaved: this.v2Tab.isSaved,
      type: 'compare',
    };
  }

  public closeItem(): void {
    if (this.item.isSaved) return this.closeTab();
    this.confirmWithNotSavedModal();
  }

  private closeTab(): void {
    this.store.dispatch(TabsActions.closeTab({ v2TabKey: this.v2Tab.id, v2CurrentTabId: this.v2CurrentTabId }));
  }

  private confirmWithNotSavedModal() {
    this.modalService
      .open(NotSavedModalComponent, 'project.tab_not_saved_modal.title', '400px')
      .pipe(
        switchMap((modalRef: ModalRef<NotSavedModalComponent>) => modalRef.getResult()),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((confirm: any) => {
        if (confirm) this.closeTab();
      });
  }
}
