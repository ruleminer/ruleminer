import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular/ui/button';

@Component({
  selector: 'rolap-select-columns-btn',
  standalone: true,
  imports: [CommonModule, DxButtonModule, TranslateModule],
  templateUrl: './select-columns-btn.component.html',
  styleUrls: ['./select-columns-btn.component.scss'],
})
export class SelectColumnsBtnComponent {
  @Input() dataCy: string = 'column-chooser-button';
  @Input() title: string = 'button_tooltip.show_column_chooser';
  @Input() disabled: boolean = false;

  @Output() buttonClick = new EventEmitter<void>();

  onClick(): void {
    this.buttonClick.emit();
  }
}
