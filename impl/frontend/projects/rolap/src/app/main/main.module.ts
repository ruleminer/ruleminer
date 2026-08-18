import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule, DxListModule, DxMenuModule } from 'devextreme-angular';

import { AppbarComponent } from '../common/components/appbar/appbar.component';
import { LogoComponent } from '../common/components/icons/logo/logo.component';
import { UserInfoModule } from '../common/components/user-info/user-info.module';
import { FooterModule } from './footer/footer.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';

@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    MainRoutingModule,
    FooterModule,
    DxMenuModule,
    DxListModule,
    DxButtonModule,
    UserInfoModule,
    TranslateModule,
    LogoComponent,
    AppbarComponent,
  ],
})
export class MainModule {}
