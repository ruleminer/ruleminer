import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TranslateService } from '@ngx-translate/core';

import { InfoComponentModes } from '../../../../common/components/info/info.component';
import { ProcessDetailService } from '../services/process-detail.service';

@Component({
  selector: 'rolap-process-detail-view',
  templateUrl: './process-detail-view.component.html',
  styleUrls: ['./process-detail-view.component.scss'],
  animations: [
    trigger('detailExpand', [
      transition(':enter', [
        style({ height: '0', opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms ease-in', style({ height: '0', opacity: 0 }))]),
    ]),
  ],
})
export class ProcessDetailViewComponent {
  @Input() set processId(processIdSignal: number) {
    this.processDetailService.setProcessId(processIdSignal);
  }
  public processStatusMode = InfoComponentModes;

  private translateService = inject(TranslateService);
  private processDetailService = inject(ProcessDetailService);

  private onLangChangeSignal = toSignal(this.translateService.onLangChange);

  private processDetailsSignal = this.processDetailService.processDetailsSignal;

  public isCalculatingSignal = this.processDetailService.isCalculatingSignal;

  public processErrorSignal = computed(() => {
    const processDetails = this.processDetailsSignal();
    const translations = this.getTranslationSignal();
    if (!processDetails || !translations) return null;

    const errorKeys = Object.keys(translations.process.errors);
    const errorKey = `process.errors.${processDetails.error_cause}`;

    const isOld = !errorKeys.includes(processDetails.error_cause);
    const isError = processDetails.status === 'FAILURE';

    return isError ? (isOld ? 'process.errors.unknown_error' : errorKey) : null;
  });

  private getCurrentTranslation = computed(() => {
    this.onLangChangeSignal();
    const lang = this.onLangChangeSignal()?.lang;
    if (!lang) return this.translateService.currentLang;
    return lang;
  });

  private getTranslationSignal = toSignal(this.translateService.getTranslation(this.getCurrentTranslation()));
}
