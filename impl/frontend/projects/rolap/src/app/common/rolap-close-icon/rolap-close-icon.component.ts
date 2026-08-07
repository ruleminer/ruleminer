import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'rolap-close-icon',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './rolap-close-icon.component.html',
  styleUrls: ['./rolap-close-icon.component.scss']
})
export class RolapCloseIconComponent {
  public readonly faTimes = faTimes;
  @Output() close = new EventEmitter<void>();

  public onCloseClick(): void {
    this.close.emit();
  }
}