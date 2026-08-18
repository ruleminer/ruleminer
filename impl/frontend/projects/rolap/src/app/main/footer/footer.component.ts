import { Component } from '@angular/core';

import { Observable, map, startWith } from 'rxjs';

import { Store } from '@ngrx/store';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { AppState } from '../../common/store/app-state.model';

interface FooterMenuLink {
  urls: { [key: string]: string };
  labelTranslateKey: string;
}

@Component({
  selector: 'rolap-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  public readonly currentYear = new Date().getFullYear().toString();
  public sidebarVisible: Observable<boolean>;
  public sidebarWidth: Observable<number>;
  public currentLanguage$: Observable<any> = this.translate.onLangChange.pipe(
    map((event: LangChangeEvent) => event.lang),
    startWith(this.translate.currentLang),
  );

  public menuDefinition: FooterMenuLink[][] = [
    [
      {
        urls: {
          pl: 'https://ruleminer.ai/pl/strona-glowna/',
          en: 'https://ruleminer.ai/',
        },
        labelTranslateKey: 'footer.menu_links.home',
      },
      {
        urls: {
          pl: 'https://ruleminer.ai/pl/publikacje/',
          en: 'https://ruleminer.ai/publications/',
        },
        labelTranslateKey: 'footer.menu_links.publications',
      },
      {
        urls: {
          pl: 'https://ruleminer.ai/pl/kontakt/',
          en: 'https://ruleminer.ai/contact/',
        },
        labelTranslateKey: 'footer.menu_links.contact',
      },
      {
        urls: {
          pl: 'https://ruleminer.ai/pl/materialy-i-dokumentacje/',
          en: 'https://ruleminer.ai/documentation/',
        },
        labelTranslateKey: 'footer.menu_links.documentation',
      },
    ],
    [
      {
        urls: {
          pl: 'https://ruleminer.ai/pl/regulamin/',
          en: 'https://ruleminer.ai/regulations/',
        },
        labelTranslateKey: 'footer.menu_links.regulations',
      },
      {
        urls: {
          pl: 'https://ruleminer.ai/pl/deklaracja-dostepnosci/',
          en: 'https://ruleminer.ai/accessibility-statement/',
        },
        labelTranslateKey: 'footer.menu_links.accessibility_statement',
      },
      {
        urls: {
          pl: 'https://ruleminer.ai/pl/polityka-prywatnosci/',
          en: 'https://ruleminer.ai/privacy-policy/',
        },
        labelTranslateKey: 'footer.menu_links.privacy_policy',
      },
    ],
  ];

  constructor(private store: Store<AppState>, private translate: TranslateService) {
    this.sidebarWidth = this.store.select((s) => s.sidebar?.width);
    this.sidebarVisible = this.store.select((s) => s.sidebar?.isVisible);
  }
}
