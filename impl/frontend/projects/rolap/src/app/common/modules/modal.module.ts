import { A11yModule } from '@angular/cdk/a11y';
import { FullscreenOverlayContainer, OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { ModalComponent } from '../components/modal/modal.component';
import { TitleComponent } from '../components/title/title.component';

@NgModule({
  imports: [CommonModule, OverlayModule, A11yModule, PortalModule, DxButtonModule, TranslateModule, TitleComponent],
  declarations: [ModalComponent],
  exports: [ModalComponent],
  providers: [OverlayModule, { provide: OverlayContainer, useClass: FullscreenOverlayContainer }],
})
export class RolapModalModule {}
