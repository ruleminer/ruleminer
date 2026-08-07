import { Component, HostListener, SkipSelf } from '@angular/core';

import { Observable } from 'rxjs';

import { faRotateLeft, faRotateRight } from '@fortawesome/pro-regular-svg-icons';

import { RulesTableEditorHistoryService } from '../../service/rules-table-editor-history.service';

const undoKeyboardShortcutEvent = 'window:keydown.control.z';
const redoKeyboardShortcutEvent = 'window:keydown.control.y';

@Component({
  selector: 'rolap-rule-editor-undo-redo-buttons',
  templateUrl: './rule-editor-undo-redo-buttons.component.html',
  styleUrls: ['./rule-editor-undo-redo-buttons.component.scss'],
})
export class RuleEditorUndoRedoButtonsComponent {
  public canUndo: Observable<boolean> = this.historyService.canUndo;
  public canRedo: Observable<boolean> = this.historyService.canRedo;

  public undoKeyboardShortcutHint = this.getShortcutHint(undoKeyboardShortcutEvent);
  public redoKeyboardShortcutHint = this.getShortcutHint(redoKeyboardShortcutEvent);

  public faRotateRight = faRotateRight;
  public faRotateLeft = faRotateLeft;

  constructor(@SkipSelf() private historyService: RulesTableEditorHistoryService) {}

  @HostListener(undoKeyboardShortcutEvent, ['$event'])
  public onUndoKeyboardShortcut(event?: KeyboardEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.undoClick();
  }

  @HostListener(redoKeyboardShortcutEvent, ['$event'])
  public onRedoKeyboardShortcut(event?: KeyboardEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.redoClick();
  }

  public undoClick() {
    this.historyService.undo();
  }

  public redoClick() {
    this.historyService.redo();
  }

  private getShortcutHint(keyboardShortcutEvent: string) {
    const hint = keyboardShortcutEvent
      .split('keydown.')[1]
      .split('.')
      .map((key) => key[0].toUpperCase().trim())
      .join('+');
    return ` (${hint})`;
  }
}
