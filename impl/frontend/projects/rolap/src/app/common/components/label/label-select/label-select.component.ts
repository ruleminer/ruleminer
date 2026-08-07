import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';

import { AppState } from '../../../store/app-state.model';
import { V2RulesTableActions } from '../../../store/v2RulesTable/v2RulesTable.action';
import { Label, LabelSelected } from '../interfaces/label.model';
import { LabelPopupService } from '../services/label-popup/label-popup.service';
import { LabelService } from '../services/label/label.service';

@Component({
  selector: 'rolap-label-select',
  templateUrl: './label-select.component.html',
  styleUrls: ['./label-select.component.scss'],
})
export class LabelSelectComponent implements OnInit, OnDestroy {
  @Input() labelsToSelect: Label[];
  @Input() isSearchVisible?: boolean = false;
  @Output() editLabel = new EventEmitter<Label>();
  @Output() selectedLabels = new EventEmitter<Label[]>();

  public filteredLabels: LabelSelected[] = [];
  public isLabelsFetched = false;
  public faXMark = faXmark;
  public searchValue: string = '';

  private labels: LabelSelected[] = [];
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private labelService: LabelService,
    private labelPopupService: LabelPopupService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.getLabels();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onLabelClick(labelId: number) {
    const index = this.labels.findIndex((x) => x.id === labelId);

    if (index > -1) {
      this.labels[index].selected = !this.labels[index].selected;
    }

    this.emitSelectedLabels();
  }

  public onLabelRemove(label: Label) {
    this.labelService
      .removeLabel(label.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.removeLabelFromList(label.id);
        this.store.dispatch(V2RulesTableActions.removeAllLabelOccurencesFromAllTables({ labelId: label.id }));
        this.labelPopupService.removePopup();
      });
  }

  public onLabelEdit(label: Label) {
    this.editLabel.emit(label);
  }

  public searchLabel(event: any) {
    const value: string = event.target.value.toLowerCase();

    if (!value) {
      this.filteredLabels = this.labels;
      return;
    }

    this.filteredLabels = this.filteredLabels.filter((x) => x.name.toLowerCase().includes(event.target.value));
  }

  public clearSearch() {
    this.searchValue = '';
    this.filteredLabels = this.labels;
  }

  private getLabels() {
    this.labelService
      .getLabels()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.labels = res;
        this.filteredLabels = res;
        this.isLabelsFetched = true;

        if (this.labels.length && this.labelsToSelect) {
          this.selectLabels();
        }
      });
  }

  private selectLabels() {
    const selectedLabelsIds = this.labelsToSelect.map((x) => x.id);

    this.labels.map((x) => {
      if (selectedLabelsIds.includes(x.id)) {
        x.selected = true;
      }
    });
  }

  private removeLabelFromList(labelId: number) {
    const index = this.labels.findIndex((x) => x.id === labelId);

    if (labelId > -1) {
      this.labels.splice(index, 1);
    }
  }

  private emitSelectedLabels() {
    const selectedLabels = this.labels.filter((x) => x.selected === true);
    const labelsToEmit = selectedLabels.map(({ selected, ...x }) => x);

    this.selectedLabels.emit(labelsToEmit);
  }
}
