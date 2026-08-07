import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'rolap-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
})
export class ColorPickerComponent {
  @Input() selectedColor: string;
  @Output() colorSelect = new EventEmitter<string>();

  public colors: string[] = [
    '#C1572A',
    '#E53935',
    '#D81B60',
    '#8E24AA',
    '#5E35B1',
    '#3949AB',
    '#1E88E5',
    '#039BE5',
    '#00ACC1',
    '#00897B',
    '#43A047',
    '#7CB342',
    '#C0CA33',
    '#FDD835',
    '#FFB300',
    '#FB8C00',
    '#F4511E',
    '#6D4C41',
    '#757575',
    '#546E7A',
    '#283034',
  ];

  public onColorClick(color: string) {
    this.colorSelect.emit(color);
  }
}
