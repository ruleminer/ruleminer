import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { TooltipComponent } from '../../tooltip/tooltip.component';
import { FormGroupTitleConfig } from './types';

/**
 * FormGroupTitleComponent
 *
 * This component is designed to display a title and an optional tooltip for example above radio buttons or a select box.
 * THIS IS NOT A LABEL
 *
 * The component takes a `FormGroupTitleConfig` object as input, which includes the title text and optional tooltip information.
 *
 * Example usage:
 *
 * ```html
 * <div class="dx-field px2">
 *   <rolap-form-group-title *ngIf="titleConfig" [title]="titleConfig" />
 *   <dx-radio-group ...></dx-radio-group>
 * </div>
 * ```
 */

@Component({
  selector: 'rolap-form-group-title',
  standalone: true,
  imports: [CommonModule, TranslateModule, TooltipComponent],
  templateUrl: './form-group-title.component.html',
})
export class FormGroupTitleComponent {
  @Input() title: FormGroupTitleConfig;
}
