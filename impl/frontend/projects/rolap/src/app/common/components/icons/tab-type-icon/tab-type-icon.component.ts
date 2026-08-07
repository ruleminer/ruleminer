import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faChartNetwork,
  faChartPie,
  faLineColumns,
  faScaleBalanced,
  faTasks,
  faTriangleExclamation,
} from '@fortawesome/pro-solid-svg-icons';

import { RolapItemTypes } from '../../../store/v2Tabs/utils';

@Component({
  selector: 'rolap-tab-type-icon',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `<fa-icon *ngIf="icon" [icon]="icon" [class.inactive]="disabled"></fa-icon>`,
  styleUrls: ['./tab-type-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabTypeIconComponent implements OnChanges {
  @Input({ required: true }) tabType: RolapItemTypes | undefined;
  @Input() disabled: boolean = false;
  public icon: IconDefinition | null = null;

  private readonly icons: Record<RolapItemTypes, IconDefinition | null> = {
    dataSet: this.disabled ? faTriangleExclamation : faLineColumns,
    ruleSet: faChartNetwork,
    report: faChartPie,
    EDA: faChartPie,
    WHITEBOX: faChartPie,
    PREDICTION: faChartPie,
    process: faTasks,
    compare: faScaleBalanced,
    rulesets_group: null,
    reports_group: null,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tabType'] || changes['disabled']) {
      this.icon = this.tabType ? this.icons[this.tabType] : null;
    }
  }
}
