import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { ValueChangedEvent } from 'devextreme/ui/select_box';

import { AVAILABLE_LANGUAGES, getDefaultLanguage } from '../../../app-config';
import { isNotCausedByUserEvent } from '../../../common/utils/devExtremeEventsUtils';
import { ProfileService } from '../service/profile.service';

interface SettingsLanguageItem {
  key: string;
  value: string;
}

@Component({
  selector: 'rolap-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  public languages: SettingsLanguageItem[] = [];
  public langValue: SettingsLanguageItem = { key: '', value: '' };
  private ngUnsubscribe = new Subject<void>();

  constructor(private translate: TranslateService, private profile: ProfileService) {}

  ngOnInit() {
    this.setLanguages();
    this.loadLanguageFromLocalStorage();
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.setLanguages();
      this.updateLanguage();
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public switchLang(event: ValueChangedEvent) {
    if (isNotCausedByUserEvent(event)) return;
    const selectedLang = event.value;
    this.setUserLanguage(selectedLang.key);
  }

  private setLanguages() {
    this.languages = AVAILABLE_LANGUAGES.map((lang) => ({
      key: lang,
      value: this.translate.instant('auth.profile.lang.' + lang),
    }));
  }

  private updateLanguage() {
    const currentLang = this.translate.currentLang;
    this.langValue = this.languages.find((lang) => lang.key === currentLang) || { key: '', value: '' };
  }

  private saveLanguageToLocalStorage(langKey: string) {
    localStorage.setItem('lang', langKey);
  }

  private loadLanguageFromLocalStorage() {
    const savedLangKey = localStorage.getItem('lang');
    const defaultLang = getDefaultLanguage(this.translate);

    if (savedLangKey && this.languages.some((lang) => lang.key === savedLangKey)) {
      this.translate.use(savedLangKey);
    } else {
      this.translate.use(defaultLang);
      this.saveLanguageToLocalStorage(defaultLang);
    }
    this.updateLanguage();
  }

  private setUserLanguage(lang: string) {
    this.profile
      .setUserLanguage(lang)
      .pipe(
        take(1),
        map((res) => res.preferred_language),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((lang) => {
        if (!lang) throw new Error('Language not set');
        this.translate.use(lang);
        this.saveLanguageToLocalStorage(lang);
      });
  }
}
