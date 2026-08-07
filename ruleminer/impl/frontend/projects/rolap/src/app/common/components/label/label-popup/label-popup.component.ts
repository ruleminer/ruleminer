import { Component, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';

import { Subject, take, takeUntil } from 'rxjs';

import { faChevronLeft, faMagnifyingGlass, faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { RuleSetApiService } from 'projects/rolap/src/app/common/services/rule-set/rule-set-api.service';

import { NotifyService } from '../../../services/notify/notify.service';
import { AppState } from '../../../store/app-state.model';
import { Ids } from '../../../store/ruleSets/rulesets.selectors';
import { V2RulesTableActions } from '../../../store/v2RulesTable/v2RulesTable.action';
import { getLabelsFromRule } from '../../../store/v2RulesTable/v2RulesTable.selectors';
import { Label, LabelPopupType, LabelPost } from '../interfaces/label.model';
import { LabelPopupService } from '../services/label-popup/label-popup.service';
import { LabelService } from '../services/label/label.service';

@Component({
  selector: 'rolap-label-popup',
  templateUrl: './label-popup.component.html',
  styleUrls: ['./label-popup.component.scss'],
})
export class LabelPopupComponent implements OnDestroy {
  @Input() labelPopupType: LabelPopupType;
  @Input() labelToEdit: Label;
  @Input() uuid: string;
  @Input() ids: Ids;
  @Input() selectedLabels: Label[];

  public isSearchVisible = false;
  public faChevronLeft = faChevronLeft;
  public faXmark = faXmark;
  public faPlus = faPlus;
  public faMagnifyingGlass = faMagnifyingGlass;

  private ngUnsubscribe: Subject<void> = new Subject();

  /**
   * Change popup position on page scroll.
   */
  @HostListener('window:scroll', ['$event']) onScroll() {
    this.labelPopupService.updateLabelPopupPosition(window.scrollX, window.scrollY);
  }

  /**
   * Close popup if clicked outside it or outside context menu.
   *
   * @param event - click event
   */
  @HostListener('document:mousedown', ['$event']) onGlobalClick(event: any): void {
    const isLabelPopupClicked = this.elementRef.nativeElement.contains(event.target);
    const targetClassName = event.target.className;
    const isContextMenuClicked =
      typeof targetClassName === 'string' ? event.target.className.includes('dx-menu-item') : false;

    if (!isLabelPopupClicked && !isContextMenuClicked) {
      this.labelPopupService.removePopup();
    }
  }

  constructor(
    private labelService: LabelService,
    private labelPopupService: LabelPopupService,
    private elementRef: ElementRef,
    private translateService: TranslateService,
    private store: Store<AppState>,
    private notifyService: NotifyService,
    private ruleSetApiService: RuleSetApiService,
  ) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public closePopup() {
    this.labelPopupService.removePopup();
  }

  public toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
  }

  public onAddNewBtnClick() {
    this.labelPopupType = 'new';
    this.labelToEdit = {
      id: 0,
      name: this.translateService.instant('labels.add_popup.example_text'),
      color: '#C1572A',
    };
  }

  public onBackBtnClick(type: LabelPopupType) {
    this.labelPopupType = type;
  }

  public onAddNewLabel() {
    if (!this.labelToEdit.name) {
      this.showNoEmptyLabelNameNotify();
      return;
    }
    const label: LabelPost = {
      name: this.labelToEdit.name,
      color: this.labelToEdit.color,
    };

    this.labelService
      .addLabel(label)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.labelPopupType = 'select';
        this.selectedLabels.push(res);
      });
  }

  public onLabelEdit(label: Label) {
    this.labelPopupType = 'edit';
    this.labelToEdit = label;
  }

  public onLabelSelected(labels: Label[]) {
    this.selectedLabels = labels;
  }

  public onSaveSelectedLabels() {
    this.store.dispatch(
      V2RulesTableActions.overwriteLabelsToCurrentTableRow({
        rowUuid: this.uuid,
        labels: this.selectedLabels,
      }),
    );
    this.saveLabels(this.selectedLabels);
    this.labelPopupService.removePopup();
  }

  public onRemoveLabel() {
    this.store.dispatch(
      V2RulesTableActions.removeLabelFromRowInCurrentTable({
        rowUuid: this.uuid,
        labelId: this.labelToEdit.id,
      }),
    );
    this.store
      .select(getLabelsFromRule(this.uuid))
      .pipe(take(1))
      .subscribe((res) => {
        if (res) this.saveLabels(res);
      });
    this.labelPopupService.removePopup();
  }

  public onSaveEditedLabel() {
    if (!this.labelToEdit.name) {
      this.showNoEmptyLabelNameNotify();
      return;
    }

    const label: LabelPost = {
      name: this.labelToEdit.name,
      color: this.labelToEdit.color,
    };

    this.labelService
      .editLabel(this.labelToEdit.id, label)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.store.dispatch(V2RulesTableActions.updateLabelsInAllTables({ label: this.labelToEdit }));
        this.labelPopupService.removePopup();
      });
  }

  private showNoEmptyLabelNameNotify() {
    this.notifyService.showNotify(this.translateService.instant('labels.no_empty'), 'error');
  }

  private saveLabels(labels: Label[]) {
    const requestData: Record<string, number[]> = {
      [this.uuid]: labels ? labels.map((x) => x.id) : [],
    };

    this.ruleSetApiService.saveLabels(this.ids.ruleSetId!, requestData).subscribe();
  }
}
