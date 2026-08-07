import { Component, Input } from '@angular/core';

import { Label } from '../interfaces/label.model';

@Component({
  selector: 'rolap-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss'],
})
export class LabelEditComponent {
  @Input() label: Label;

  public characterLimit = 20;

  public onColorSelect(event: string) {
    this.label.color = event;
  }
}
