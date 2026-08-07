import { Component } from '@angular/core';

import { Subject, combineLatest, map, merge, startWith, switchMap, timer } from 'rxjs';

import { faRotateLeft, faRotateRight } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../common/store/app-state.model';
import { V2RulesTableActions } from '../../../../../../common/store/v2RulesTable/v2RulesTable.action';
import {
  selectRedoStackEntities,
  selectUndoStackEntities,
} from '../../../../../../common/store/v2RulesTable/v2RulesTable.selectors';

/**
 * This component provides Undo/Redo button functionalities for a rules table.
 * It uses the NgRx store to manage the state of Undo/Redo stacks.
 * Temporarily disables buttons for 1 second after each click.
 */
@Component({
  selector: 'rolap-rules-table-undo-redo-buttons',
  templateUrl: './rules-table-undo-redo-buttons.component.html',
  styleUrls: ['./rules-table-undo-redo-buttons.component.scss'],
})
export class RulesTableUndoRedoButtonsComponent {
  public faRotateRight = faRotateRight;
  public faRotateLeft = faRotateLeft;
  private readonly DISABLE_DURATION = 1000;

  private undoClick$ = new Subject<void>();
  private redoClick$ = new Subject<void>();
  private combinedClick$ = merge(this.undoClick$, this.redoClick$);

  private temporaryDisable$ = this.combinedClick$.pipe(
    switchMap(() =>
      timer(this.DISABLE_DURATION).pipe(
        map(() => false),
        startWith(true),
      ),
    ),
    startWith(false),
  );

  public isUndoDisabled$ = combineLatest([
    this.store.select(selectUndoStackEntities).pipe(map((undoStack) => undoStack.length === 0)),
    this.temporaryDisable$,
  ]).pipe(map(([isUndoStackEmpty, isTemporarilyDisabled]) => isUndoStackEmpty || isTemporarilyDisabled));

  public isRedoDisabled$ = combineLatest([
    this.store.select(selectRedoStackEntities).pipe(map((redoStack) => redoStack.length === 0)),
    this.temporaryDisable$,
  ]).pipe(map(([isRedoStackEmpty, isTemporarilyDisabled]) => isRedoStackEmpty || isTemporarilyDisabled));

  constructor(private store: Store<AppState>) {}

  public undoClick() {
    this.store.dispatch(V2RulesTableActions.undoAction());
    this.undoClick$.next();
  }

  public redoClick() {
    this.store.dispatch(V2RulesTableActions.redoAction());
    this.redoClick$.next();
  }
}
