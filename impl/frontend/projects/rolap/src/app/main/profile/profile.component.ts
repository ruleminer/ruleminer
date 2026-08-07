import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { NavigationService } from '../../common/services/navigation.service';
import { ProfileService } from './service/profile.service';

@Component({
  selector: 'rolap-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly navigationService = inject(NavigationService);

  private readonly userInfo$ = this.profileService.getUserInfo();
  public readonly userInfo = toSignal(this.userInfo$, { initialValue: null });

  public onBackBtnClick(): void {
    this.navigationService.back();
  }
}
