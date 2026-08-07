import { Component, Input, OnInit } from '@angular/core';

import { Observable, from, map } from 'rxjs';

import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
})
export class UserInfoComponent implements OnInit {
  @Input() showAvatar = true;
  @Input() showName = true;
  @Input() avatarDiameter = 32;

  public firstName$: Observable<string | undefined>;
  public isOpen = false;

  constructor(private keycloak: KeycloakService) {}

  ngOnInit(): void {
    this.firstName$ = from(this.keycloak.loadUserProfile()).pipe(map((keycloakProfile) => keycloakProfile.username));
  }

  public toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  public closeDropdown(): void {
    this.isOpen = false;
  }
}
