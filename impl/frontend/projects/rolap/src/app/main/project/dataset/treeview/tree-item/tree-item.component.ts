import { AfterViewInit, Component, DestroyRef, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

import { faEllipsisV } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { DxContextMenuComponent } from 'devextreme-angular';
import { ItemClickEvent as ItemClickEventCM } from 'devextreme/ui/context_menu';
import { ContextMenuItem } from 'projects/rolap/src/app/common/interfaces/context-menu.model';

import { AppState } from '../../../../../common/store/app-state.model';
import { sidebarVisibilitySelector, sidebarWidthSelector } from '../../../../../common/store/sidebar/sidebar.reducer';
import { selectCurrentV2TabId } from '../../../../../common/store/v2CurrentTab/v2CurrentTab.selectors';
import { MappedItem } from '../../models/treeview';
import { TreeItemActionService } from '../service/tree-item-actions.service';
import { AllActionTypes } from '../service/tree-item-actions.types';
import { TranslateResponse } from './tree-item.types';

/**
 * Represents a single item within the Rolap tree Component.
 * Handles displaying the item's details, context menu interactions,
 * and visual states like current selection tooltip translations ect.
 * Uses TreeItemActionService to delegate specific actions and context menu generation.
 */
@Component({
  selector: 'rolap-tree-item',
  templateUrl: './tree-item.component.html',
  styleUrls: ['./tree-item.component.scss'],
})
export class TreeItemComponent implements AfterViewInit {
  @ViewChild('contextMenu', { static: false }) contextMenu!: DxContextMenuComponent;
  private destroyRef = inject(DestroyRef);
  private store = inject(Store<AppState>);
  private translate = inject(TranslateService);
  private elRef = inject(ElementRef);
  private treeItemActionService = inject(TreeItemActionService);

  private readonly sidebarWidthSelector = this.store.select(sidebarWidthSelector).pipe(distinctUntilChanged());
  private readonly isSidebarVisibleSelector = this.store.select(sidebarVisibilitySelector);
  public readonly currentTabId$ = this.store.select(selectCurrentV2TabId).pipe(filterOutNullish());
  public readonly faEllipsis = faEllipsisV;

  /** tree item from input coverted to rxjs. */
  private itemSubject = new BehaviorSubject<MappedItem | null>(null);
  public item$: Observable<MappedItem> = this.itemSubject.pipe(
    filter((item): item is MappedItem => !!item),
    distinctUntilChanged((prev, curr) => prev.id === curr.id && prev.type === curr.type),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  @Input({ required: true }) set item(value: MappedItem) {
    this.itemSubject.next(value);
  }

  /** Observable emitting true if this tree item represents the root project node. */
  public isItemFirst$: Observable<boolean> = this.item$.pipe(
    map((item) => (item.ids?.projectId as any) === item.id && item.id != null),
    distinctUntilChanged(),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Observable emitting true if this tree item corresponds to the currently open tab. */
  public isCurrent$: Observable<boolean> = combineLatest([this.item$, this.currentTabId$]).pipe(
    map(([item, tabId]) => item.id === tabId && item.id != null),
    distinctUntilChanged(),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Observable emitting true if the full name tooltip should be shown (based on sidebar visibility and text ellipsis). */
  public showFullNameTooltip$: Observable<boolean> = combineLatest([
    this.isSidebarVisibleSelector,
    this.sidebarWidthSelector,
    this.item$,
  ]).pipe(
    debounceTime(100),
    map(([isVisible, _, item]) => {
      if (!isVisible || !item) return false;

      const itemElement = this.elRef.nativeElement?.querySelector(`#text-${item.id}`);
      const showBecauseOfEllipsis = itemElement && this.isEllipsisActive(itemElement);

      return showBecauseOfEllipsis;
    }),
    distinctUntilChanged(),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Observable emitting the array of context menu items applicable to the current item. */
  public contextMenuItems$: Observable<ContextMenuItem[]> = this.item$.pipe(
    switchMap((item) =>
      combineLatest({
        translations: this.translate.get('project.treeview.context_menu.button'),
        item: of(item),
      }),
    ),
    switchMap(({ translations, item }) => {
      if (!item?.type) return of([]);
      const simpleRes: TranslateResponse = {
        treeview: { context_menu: { button: translations } },
      };
      return this.treeItemActionService
        .getContextMenuItems(item.type, simpleRes, item)
        .pipe(map((items) => items ?? []));
    }),
    startWith([]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  ngAfterViewInit(): void {
    this.item$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((item) => {
      if (item.isDisabled) {
        setTimeout(() => this.hideNodeToggler(), 0);
      }
    });
  }

  /**
   * Handles click events from the DevExtreme context menu.
   * Delegates the action execution to the TreeItemActionService.
   * @param event The context menu item click event.
   */
  public contextMenuClick(event: ItemClickEventCM): void {
    const currentItem = this.itemSubject.getValue();
    if (!currentItem?.type || !currentItem?.ids) return;

    const itemData = event.itemData as ContextMenuItem;
    const actionType = itemData?.type as AllActionTypes;
    const itemType = currentItem.type;

    if (!actionType) return;
    this.treeItemActionService.executeAction(itemType, actionType, currentItem.ids, currentItem.text ?? '');
  }

  /**
   * Checks if the text content of an HTML element is overflowing and triggering ellipsis.
   * Temporarily modifies element style to measure content width vs offset width.
   * @param e The HTML element to check.
   * @returns True if ellipsis is active, false otherwise.
   */
  private isEllipsisActive(e: HTMLElement): boolean {
    if (!e) return false;
    return e.offsetWidth < e.scrollWidth;
  }

  /**
   * Hides the expand/collapse toggler element within the parent dx-treeview-node.
   * Uses direct DOM manipulation, which can be brittle.
   */
  private hideNodeToggler(): void {
    const nodeElement = this.elRef?.nativeElement?.closest('.dx-treeview-node');
    const nodeToggler = nodeElement?.querySelector('.dx-treeview-toggle-item-visibility');
    if (nodeToggler && (nodeToggler as HTMLElement).style.display !== 'none') {
      (nodeToggler as HTMLElement).style.display = 'none';
    }
  }

  public showContextMenu(): void {
    if (!this.contextMenu || !this.contextMenu.instance) return;
    this.contextMenu.instance.show();
  }
}
