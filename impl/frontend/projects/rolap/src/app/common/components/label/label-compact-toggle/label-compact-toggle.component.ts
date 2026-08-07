import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../store/app-state.model';
import { toggleCompactState } from '../../../store/labels/labels.action';
import { labelsCompactedSelector } from '../../../store/labels/labels.reducer';

@Component({
  selector: 'rolap-label-compact-toggle',
  templateUrl: './label-compact-toggle.component.html',
  styleUrls: ['./label-compact-toggle.component.scss'],
})
export class LabelCompactToggleComponent implements OnInit, OnDestroy {
  public isCompact: boolean;

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store
      .select(labelsCompactedSelector)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.isCompact = res;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public labelToggle() {
    this.store.dispatch(toggleCompactState());
  }

  public onKeyboardKeydown(event: KeyboardEvent) {
    event.stopPropagation();

    if (event.key !== 'Enter') return;
    this.labelToggle();
  }
}
