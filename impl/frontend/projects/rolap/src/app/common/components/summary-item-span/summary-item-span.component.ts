import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'rolap-summary-item-span',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './summary-item-span.component.html',
  styleUrls: ['./summary-item-span.component.scss'],
})
export class SummaryItemSpanComponent {
  @Input() keyTranslate: string;
  @Input() value: string | number;

  @Input() keyDataCy: string = 'summary-key';
  @Input() valueDataCy: string = 'summary-value';
}
