import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { RolapModalModule } from '../../modules/modal.module';
import { AvatarComponent } from './avatar/avatar.component';
import { UserContextMenuComponent } from './user-context-menu/user-context-menu.component';
import { UserInfoComponent } from './user-info.component';

@NgModule({
  declarations: [UserInfoComponent, AvatarComponent, ClickOutsideDirective, UserContextMenuComponent],
  imports: [CommonModule, TranslateModule, FontAwesomeModule, RolapModalModule],
  exports: [UserInfoComponent],
})
export class UserInfoModule {}
