import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';

import { FirstLetterModule } from '../../pipes/first-letter/first-letter.module';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { LabelCompactToggleComponent } from './label-compact-toggle/label-compact-toggle.component';
import { LabelEditComponent } from './label-edit/label-edit.component';
import { LabelPopupComponent } from './label-popup/label-popup.component';
import { LabelSelectComponent } from './label-select/label-select.component';
import { LabelComponent } from './label/label.component';
import { SelectionMarkerComponent } from './selection-marker/selection-marker.component';
import { TableLabelComponent } from './table-label/table-label.component';

@NgModule({
  declarations: [
    LabelSelectComponent,
    LabelPopupComponent,
    LabelComponent,
    SelectionMarkerComponent,
    LabelEditComponent,
    ColorPickerComponent,
    TableLabelComponent,
    LabelCompactToggleComponent,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    TranslateModule,
    FormsModule,
    DxButtonModule,
    DxTextBoxModule,
    DxContextMenuModule,
    FirstLetterModule,
    DxSwitchModule,
  ],
  exports: [LabelPopupComponent, TableLabelComponent, LabelCompactToggleComponent],
})
export class LabelModule {}
