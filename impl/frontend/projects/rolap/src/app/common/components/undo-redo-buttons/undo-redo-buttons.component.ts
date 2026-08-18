import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRedoAlt, faUndoAlt } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'rolap-undo-redo-buttons',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="undo-redo-actions" style="display: flex; gap: 8px; align-items: center;">
      <button type="button" (click)="onUndo()" [disabled]="!canUndo" title="Cofnij">
        <fa-icon [icon]="faUndoAlt"></fa-icon>
      </button>
      <button type="button" (click)="onRedo()" [disabled]="!canRedo" title="Ponów">
        <fa-icon [icon]="faRedoAlt"></fa-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .undo-redo-actions button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .undo-redo-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .undo-redo-actions button:not(:disabled):hover {
        background: #f0f0f0;
      }
    `,
  ],
})
export class UndoRedoButtonsComponent {
  @Input() canUndo = false;
  @Input() canRedo = false;
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();

  public faUndoAlt = faUndoAlt;
  public faRedoAlt = faRedoAlt;

  public onUndo() {
    this.undo.emit();
  }

  public onRedo() {
    this.redo.emit();
  }
}
