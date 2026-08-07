import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { faArrowRightFromBracket, faBook, faBug, faCircleUser } from '@fortawesome/pro-regular-svg-icons';
import { TranslateService } from '@ngx-translate/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from 'projects/rolap/src/environments/environment';

import { ModalService } from '../../../services/modal/modal.service';
import { ReportBugComponent } from '../../report-bug/report-bug.component';

@Component({
  selector: 'rolap-user-context-menu',
  templateUrl: './user-context-menu.component.html',
  styleUrls: ['./user-context-menu.component.scss'],
})
export class UserContextMenuComponent {
  public logoutIcon = faArrowRightFromBracket;
  public profileIcon = faCircleUser;
  public reportBugIcon = faBug;
  public documentationIcon = faBook;

  private keycloak = inject(KeycloakService);
  private router = inject(Router);
  private modal = inject(ModalService);
  private translateService = inject(TranslateService);

  private onLangChangeSignal = toSignal(this.translateService.onLangChange);
  private getCurrentTranslation = computed(() => {
    this.onLangChangeSignal();
    const lang = this.onLangChangeSignal()?.lang;
    if (!lang) return this.translateService.currentLang;
    return lang;
  });

  public goToDocumentation() {
    const lang = this.getCurrentTranslation();
    const url =
      lang === 'pl'
        ? 'https://ruleminer.ai/pl/materialy-i-dokumentacje/'
        : 'https://github.com/ruleminer/ruleminer/wiki';

    window.open(url, '_blank');
  }

  public async logout(): Promise<void> {
    await this.keycloak.logout(window.location.origin + environment.baseHref);
  }

  public goToProfile() {
    this.router.navigate(['/profile']);
  }

  public reportBug() {
    const title = this.translateService.instant('report_bug.modal.title');
    this.modal.open(
      ReportBugComponent,
      title,
      undefined,
      undefined,
      { freshStart: true },
      { closeOnBackdropClick: false, closeOnEscapeClick: false, position: 'center' },
    );
  }
}
