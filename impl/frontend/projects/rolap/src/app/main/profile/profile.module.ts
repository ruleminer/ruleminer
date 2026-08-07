import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule, DxSelectBoxModule } from 'devextreme-angular';

import { CardModule } from '../../common/components/card/card.module';
import { InfoComponent } from '../../common/components/info/info.component';
import { BytesToMbPipe } from '../../common/pipes/bytes-to-mb.pipe';
import { AccountComponent } from './account/account.component';
import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
import { SettingsComponent } from './settings/settings.component';
import { SubscriptionPlanComponent } from './subscription-plan/subscription-plan.component';

@NgModule({
  declarations: [ProfileComponent, AccountComponent, SettingsComponent, SubscriptionPlanComponent],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    DxButtonModule,
    TranslateModule,
    CardModule,
    DxSelectBoxModule,
    BytesToMbPipe,
    InfoComponent,
  ],
})
export class ProfileModule {}
