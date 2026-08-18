import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { cloneDeep } from 'lodash';
import { Subcondition } from '../../../main/project/project-rules/project-rules-table/project-rules-table-editor/types/rules-editor';

interface HistoryState {
  formValue: unknown;
  subconditions: Subcondition[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class UndoRedoService {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private readonly MAX_HISTORY_SIZE = 10;

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);

  canUndo$ = this.canUndoSubject.asObservable();
  canRedo$ = this.canRedoSubject.asObservable();

  constructor() { }

  /**
   * Initializes the history with the very first state of the editor.
   * Call this when the filter builder loads its initial data.
   */
  public initializeHistory(initialSubconditions: Subcondition[], initialFormValue: unknown = null): void {
    this.clearHistory();
    this.addSnapshot(initialFormValue, initialSubconditions, true);
  }

  /**
   * Adds a new state snapshot to the history.
   * @param formValue The current form value (raw form value from getRawValue()) to save.
   * @param subconditions The current subconditions array (for valid states) or null (for invalid states).
   * @param isInitial Optional flag if this is the very first state being added.
   */
  public addSnapshot(formValue: unknown, subconditions: Subcondition[] | null = null, isInitial: boolean = false): void {
    const historyState: HistoryState = {
      formValue: formValue ? cloneDeep(formValue) : null,
      subconditions: subconditions ? cloneDeep(subconditions) : null
    };

    if (!isInitial && this.currentIndex >= 0 && this.history.length > 0) {
      const currentState = this.history[this.currentIndex];
      const areStatesEqual = this.areStatesEqual(currentState, historyState);
      if (areStatesEqual) {
        this.updateButtonStates();
        return;
      }
    }

    // Remove any future states if we're not at the end (branching from middle of history)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(historyState);
    this.currentIndex++;

    // Maintain maximum history size
    if (this.history.length > this.MAX_HISTORY_SIZE) {
      this.history.shift();
      this.currentIndex--;
    }
    
    this.updateButtonStates();
  }

  private areStatesEqual(state1: HistoryState, state2: HistoryState): boolean {
    const cleanedFormValue1 = this.removeNullAndUndefined(state1.formValue);
    const cleanedFormValue2 = this.removeNullAndUndefined(state2.formValue);
    
    return JSON.stringify(cleanedFormValue1) === JSON.stringify(cleanedFormValue2);
  }

  private removeNullAndUndefined(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullAndUndefined(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = (obj as Record<string, unknown>)[key];
          if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = this.removeNullAndUndefined(value);
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Reverts to the previous state in history.
   * @returns The previous HistoryState, or null if no undo is possible.
   */
  public undo(): HistoryState | null {
    if (this.currentIndex <= 0) {
      this.updateButtonStates();
      return null;
    }
    this.currentIndex--;
    this.updateButtonStates();
    return cloneDeep(this.history[this.currentIndex]);
  }

  /**
   * Moves to the next state in history (after an undo).
   * @returns The next HistoryState, or null if no redo is possible.
   */
  public redo(): HistoryState | null {
    if (this.currentIndex >= this.history.length - 1) {
      this.updateButtonStates();
      return null;
    }
    this.currentIndex++;
    this.updateButtonStates();
    return cloneDeep(this.history[this.currentIndex]);
  }

  /**
   * Updates the observable states for undo/redo buttons.
   */
  private updateButtonStates(): void {
    this.canUndoSubject.next(this.currentIndex > 0);
    this.canRedoSubject.next(this.currentIndex < this.history.length - 1);
  }

  /**
   * Clears the entire history. Useful if the filter context changes completely.
   */
  public clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    this.updateButtonStates();
  }
}