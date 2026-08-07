import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'rolap-visibility-toggle-icon',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule],
  styles: ['button { height: 100% }'],
  template: ` <button (click)="changeValue()" [attr.aria-label]="'project.prediction.toggle_visibility' | translate">
    <fa-icon *ngIf="toggled" [icon]="faEye" class="icon-secondary fa-fw"></fa-icon>
    <fa-icon *ngIf="!toggled" [icon]="faEyeSlash" class="icon-secondary fa-fw"></fa-icon>
  </button>`,
})
export class VisibilityToggleIconComponent {
  @Input() toggled: boolean;
  @Output() toggledChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  public faEye = faEye;
  public faEyeSlash = faEyeSlash;

  public changeValue(): void {
    this.toggled = !this.toggled;
    this.toggledChange.emit(this.toggled);
  }
}
