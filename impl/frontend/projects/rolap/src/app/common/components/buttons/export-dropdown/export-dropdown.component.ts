import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFile, faFileAlt, faFileCsv, faFileExcel } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { DxDropDownButtonModule } from 'devextreme-angular/ui/drop-down-button';

export interface ExportItem {
  text: string;
  onClick: () => void;
  hint?: string;
}

@Component({
  selector: 'rolap-export-dropdown',
  standalone: true,
  imports: [CommonModule, DxDropDownButtonModule, FontAwesomeModule, TranslateModule],
  template: `
    <dx-drop-down-button
      [disabled]="isDisabled!"
      [text]="'export_btn' | translate"
      width="160px"
      [items]="exportItems"
      itemTemplate="item-template"
      [useSelectMode]="false"
      displayExpr="text"
      [useItemTextAsTitle]="false"
      itemHintExpr="hint">
      <div *dxTemplate="let data of 'button-template'">
        <div class="text-container">
          <div class="status">Export</div>
        </div>
      </div>
      <div *dxTemplate="let item of 'item-template'">
        <ng-container [ngSwitch]="item.text">
          <fa-icon *ngSwitchCase="'CSV'" [icon]="exportTypeIcons['CSV']" class="icon-secondary fa-fw"></fa-icon>
          <fa-icon *ngSwitchCase="'XLSX'" [icon]="exportTypeIcons['XLSX']" class="icon-secondary fa-fw"></fa-icon>
          <fa-icon *ngSwitchCase="'TXT'" [icon]="exportTypeIcons['TXT']" class="icon-secondary fa-fw"></fa-icon>
          <fa-icon *ngSwitchCase="'JSON'" [icon]="exportTypeIcons['JSON']" class="icon-secondary fa-fw"></fa-icon>
          <ng-container *ngSwitchDefault></ng-container>
        </ng-container>
        <span class="ml1">{{ item.text }}</span>
      </div>
    </dx-drop-down-button>
  `,
  styleUrls: ['./export-dropdown.component.scss'],
})
export class ExportDropdownComponent {
  @Input() isDisabled: boolean | null = false;
  @Input() exportItems: ExportItem[] = [];

  public exportTypeIcons = {
    CSV: faFileCsv,
    XLSX: faFileExcel,
    TXT: faFileAlt,
    JSON: faFile,
  };
}
