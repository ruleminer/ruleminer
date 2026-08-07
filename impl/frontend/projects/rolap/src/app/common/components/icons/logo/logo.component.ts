import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'rolap-logo',
  standalone: true,
  imports: [CommonModule],
  template: `<img src="assets/images/rolap_logo_emblem.svg" [alt]="'Ruleminer logo'" />`,
})
export class LogoComponent {}
