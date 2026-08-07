import { Injectable, signal } from '@angular/core';

import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { ValueChangedEvent } from 'devextreme/ui/filter_builder';

import { RuleEditorState } from './models';
import { StateHistory } from './utils';

@Injectable()
export class RulesTableEditorHistoryService {
  private readonly MAX_HISTORY_SIZE = 10;

  private $stateChange: Subject<RuleEditorState>;
  private $canUndo: BehaviorSubject<boolean>;
  private $canRedo: BehaviorSubject<boolean>;
  private $canModify: Subject<boolean>;
  private history: StateHistory<RuleEditorState>;

  public premiseChangeEventSignal = signal<ValueChangedEvent | null>(null);

  constructor() {
    this.$stateChange = new Subject<RuleEditorState>();
    this.$canUndo = new BehaviorSubject<boolean>(false);
    this.$canRedo = new BehaviorSubject<boolean>(false);
    this.$canModify = new Subject<boolean>();
    this.history = new StateHistory<RuleEditorState>(this.MAX_HISTORY_SIZE);
    this.$canModify.next(true);
  }

  public get stateChange(): Observable<RuleEditorState> {
    return this.$stateChange.asObservable();
  }

  public get canUndo(): Observable<boolean> {
    return this.$canUndo.asObservable();
  }

  public get canRedo(): Observable<boolean> {
    return this.$canRedo.asObservable();
  }

  public get canModify(): Observable<boolean> {
    return this.$canModify.asObservable();
  }

  /**
   * Pushes new state to history and updates undo and redo states.
   * @param state
   */
  public pushHistory(state: RuleEditorState, preventPush: boolean = false) {
    if (!preventPush) {
      this.history.push(state);
    }
    this.updateOperationsFlags();
  }

  /**
   * Overwrites latest state in history without adding a new entry to it.
   * @param state
   */
  public modifyHistory(state: RuleEditorState) {
    const lastState = this.history.peek();
    if (lastState === undefined) {
      throw new Error('This method cannot be called when history is empty.');
    }
    this.history.modify(state);
    this.updateOperationsFlags();
  }

  public undo() {
    if (!this.history.canUndo()) return;
    const state: RuleEditorState = this.history.undo();
    this.$stateChange.next(state);
    this.updateOperationsFlags();
  }

  public redo() {
    if (!this.history.canRedo()) return;
    const state: RuleEditorState = this.history.redo();
    this.$stateChange.next(state);
    this.updateOperationsFlags();
  }

  private updateOperationsFlags() {
    // Emit only if some of the flags have changed
    const canRedo = this.history.canRedo();
    if (canRedo !== this.$canRedo.getValue()) {
      this.$canRedo.next(canRedo);
    }
    const canUndo = this.history.canUndo();
    if (canUndo !== this.$canUndo.getValue()) {
      this.$canUndo.next(canUndo);
    }
  }
}
