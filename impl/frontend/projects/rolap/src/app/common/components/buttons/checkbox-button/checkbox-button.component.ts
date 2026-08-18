import { Component, EventEmitter, Input, Output } from '@angular/core';

import { DxCheckBoxModule } from 'devextreme-angular';

@Component({
  selector: 'rolap-checkbox-button',
  templateUrl: './checkbox-button.component.html',
  standalone: true,
  imports: [DxCheckBoxModule],
  styleUrls: ['./checkbox-button.component.scss'],
})
export class CheckboxButtonComponent {
  @Input() data: boolean | null;
  @Output() onSetSelectedIndex = new EventEmitter<any>();

  public setSelectedIndex(event: any, data: any): void {
    if (!event.event) return;
    this.onSetSelectedIndex.emit({
      event,
      data,
    });
  }
}
