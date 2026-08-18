import { Component, EventEmitter, Output } from '@angular/core';

import { faEraser } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'rolap-selection-clear-button',
  templateUrl: './selection-clear-button.component.html',
  styleUrls: ['./selection-clear-button.component.scss'],
})
export class SelectionClearButtonComponent {
  @Output() onClick = new EventEmitter();
  public faEraser = faEraser;

  public onClearSelectionClick() {
    this.onClick.emit();
  }
}
