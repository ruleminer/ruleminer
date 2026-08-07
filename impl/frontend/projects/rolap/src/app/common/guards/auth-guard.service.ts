import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Data, Route, Router, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs';

import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService extends KeycloakAuthGuard {
  constructor(protected override readonly router: Router, protected readonly keycloak: KeycloakService) {
    super(router, keycloak);
  }

  canLoad(route: Route): Observable<boolean> | Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        this.authenticated = await this.keycloakAngular.isLoggedIn();
        this.roles = await this.keycloakAngular.getUserRoles(true);

        const redirectUrl = '/' + route.path;
        const result = await this.checkAccessAllowed(route.data as Data, redirectUrl);
        resolve(result);
      } catch (error) {
        reject('An error happened during access validation. Details:' + error);
      }
    });
  }

  public isAccessAllowed(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkAccessAllowed(route.data, state.url);
  }

  public checkAccessAllowed(_data: Data, redirectUrl: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.authenticated) {
        this.keycloakAngular
          .login({
            redirectUri: window.location.origin + redirectUrl,
          })
          .catch((e) => console.error(e));
        return reject(false);
      }

      return resolve(true);
    });
  }
}
