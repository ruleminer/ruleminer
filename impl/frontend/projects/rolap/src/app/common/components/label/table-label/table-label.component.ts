import { Component, Input, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';

import { AppState } from '../../../store/app-state.model';
import { labelsCompactedSelector } from '../../../store/labels/labels.reducer';
import { Ids } from '../../../store/ruleSets/rulesets.selectors';
import { Label } from '../interfaces/label.model';
import { LabelPopupComponent } from '../label-popup/label-popup.component';
import { LabelPopupService } from '../services/label-popup/label-popup.service';

@Component({
  selector: 'rolap-table-label',
  templateUrl: './table-label.component.html',
  styleUrls: ['./table-label.component.scss'],
})
export class TableLabelComponent implements OnInit, OnDestroy {
  @Input() uuid: string;
  @Input() labels: Label[];
  @Input() ids: Ids;
  @Input() readonly = false;

  public faPlus = faPlus;
  public compact: boolean;

  private offsetX: number = 10;
  private offsetY: number = -25;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private labelPopupService: LabelPopupService,
    private vcRef: ViewContainerRef,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.store
      .select(labelsCompactedSelector)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.compact = res;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public addLabel(event: any) {
    const labelPopupComponentRef = this.vcRef.createComponent(LabelPopupComponent);
    const posX = event.clientX + this.offsetX;
    const posY = event.clientY + this.offsetY;
    labelPopupComponentRef.instance.labelPopupType = 'select';
    labelPopupComponentRef.instance.uuid = this.uuid;
    labelPopupComponentRef.instance.ids = this.ids;
    labelPopupComponentRef.instance.selectedLabels = this.labels;

    this.labelPopupService.showLabelPopup(labelPopupComponentRef, posX, posY);
  }
}
