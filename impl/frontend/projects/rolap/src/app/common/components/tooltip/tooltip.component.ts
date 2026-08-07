import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faQuestionCircle } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxButtonModule, DxTooltipModule } from 'devextreme-angular';
import { nanoid } from 'nanoid';

interface Params {
  id: number;
  name: string;
  parameter_type: string;
  expert_induction: boolean;
  description_pl: string;
  description_en: string;
  default_value: boolean;
  min_value: null | number;
  max_value: null | number;
  algorithm: number;
}

export type Description = Pick<Params, 'description_pl' | 'description_en'>;

@Component({
  selector: 'rolap-tooltip',
  standalone: true,
  imports: [CommonModule, DxTooltipModule, TranslateModule, DxButtonModule, FontAwesomeModule],
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
})
export class TooltipComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: Description;
  @Input() tooltip: string;
  @Input() customClasses: string;
  @Input() customWrapperClasses: string;
  public show = false;
  public faQuestionCircle = faQuestionCircle;
  public tooltipElementId = `tooltip--${nanoid()}`;
  public description: string;
  public currentLanguage: string;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.updateCurrentLang();
      this.updateDescription();
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.updateDescription();
      this.updateCurrentLang();
    }
    if (changes['data'] || changes['tooltip']) {
      this.show = !!this.data || this.tooltip;
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private updateCurrentLang(): void {
    this.currentLanguage = this.translateService.currentLang;
    this.updateDescription();
  }

  private updateDescription(): void {
    if (!this.data) return;
    this.description = this.currentLanguage === 'pl' ? this.data.description_pl : this.data.description_en;
  }
}
