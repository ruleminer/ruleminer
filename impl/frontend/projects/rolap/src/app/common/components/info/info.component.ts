import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faCircleExclamation,
  faQuestionCircle,
  faTriangleExclamation,
  faWindowClose,
} from '@fortawesome/pro-regular-svg-icons';
import { DxButtonModule } from 'devextreme-angular';

export enum InfoComponentModes {
  INFO = 'info',
  ERROR = 'error',
  WARNING = 'warning',
}

/**
 * Component for displaying information
 *
 * @export
 * @class InfoComponent
 */
@Component({
  selector: 'rolap-info',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, DxButtonModule],
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent implements OnChanges {
  @Input() mode: string = InfoComponentModes.INFO;
  @Input() showCloseButton: boolean = false;
  @Output() close = new EventEmitter<void>();

  public icons: { [mode: string]: IconDefinition } = {
    [InfoComponentModes.INFO]: faQuestionCircle,
    [InfoComponentModes.WARNING]: faTriangleExclamation,
    [InfoComponentModes.ERROR]: faCircleExclamation,
  };

  public closeIcon: IconDefinition = faWindowClose;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      const mode = changes['mode'].currentValue;
      if (!Object.values(InfoComponentModes).includes(mode)) {
        throw new Error(
          `InfoComponent: Invalid mode "${mode}", supported modes are: ${Object.values(InfoComponentModes).join(', ')}`,
        );
      }
      this.mode = mode as InfoComponentModes;
    }
  }

  public closeClick(): void {
    this.close.emit();
  }
}
