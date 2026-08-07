import { Component, computed, inject } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ProcessDetailService } from '../../services/process-detail.service';

@Component({
  selector: 'rolap-process-history-item',
  templateUrl: './process-history-item.component.html',
  styleUrls: ['./process-history-item.component.scss'],
})
export class ProcessHistoryItemComponent {
  private processDetailsService = inject(ProcessDetailService);
  private translateService = inject(TranslateService);

  private processDetailsSignal = this.processDetailsService.processDetailsSignal;

  private reportTypeTranslation = computed(() => {
    const processDetails = this.processDetailsSignal();
    if (!processDetails) return null;

    const typeMap: { [key: string]: string } = {
      'knowledge discovery report': 'process.table.details.report_type.knowledge_discovery',
      'prediction report': 'process.table.details.report_type.prediction',
      'EDA report': 'process.table.details.report_type.explorative_data_analysis',
    };
    const translationKey = typeMap[processDetails.meta.type] || processDetails.meta.type;
    return this.translateService.instant(translationKey);
  });

  public preparedHistoryDetails = computed(() => {
    const processDetails = this.processDetailsSignal();

    if (!processDetails || processDetails.type !== 'report') return null;

    const preparedDetails = {
      title: processDetails.meta.title,
      type: this.reportTypeTranslation(),
    };
    return preparedDetails;
  });
}
