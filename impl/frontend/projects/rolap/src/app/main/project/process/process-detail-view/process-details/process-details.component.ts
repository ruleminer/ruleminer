import { Component, computed, inject } from '@angular/core';

import { ProcessMeta, ProcessStatus } from '../../models/process.model';
import { ProcessDetailService } from '../../services/process-detail.service';

@Component({
  selector: 'rolap-process-details',
  templateUrl: './process-details.component.html',
  styleUrls: ['./process-details.component.scss'],
})
export class ProcessDetailsComponent {
  private processDetailsService = inject(ProcessDetailService);

  public processDetailsSignal = this.processDetailsService.processDetailsSignal;

  public processParams = computed<any[]>(() =>
    this.prepareProcessParams(this.processDetailsSignal()?.meta?.generation_params ?? {}),
  );

  public showStopProcessBtnSignal = computed(() => {
    const details = this.processDetailsSignal();
    if (!details) return false;
    return details.meta.generated_rules && details.status === ProcessStatus.started;
  });

  public processStatus = computed(() => {
    const details = this.processDetailsSignal();
    if (
      !details ||
      !(
        details.meta.generated_rules &&
        (details.status === ProcessStatus.stopped || details.status === ProcessStatus.stopping)
      )
    ) {
      return null;
    }
    return {
      status: details.status,
      statusLowerCaseTooltipText: `process.table.tooltips.${details.status.toLowerCase()}`,
    };
  });

  public stopProcess() {
    this.processDetailsService.updateProcessDetailsSignalStatus(ProcessStatus.stopping);
  }

  /**
   * Preparing an object with parameters to be displayed as a key-value list.
   * If the value is an object, it is converted to a string.
   *
   * @param params - object with params
   */
  private prepareProcessParams(params: ProcessMeta['generation_params']) {
    const entries = Object.entries(params);

    entries.map((x) => {
      const isObject = typeof x[1] === 'object';

      if (!isObject) return;

      let result = JSON.stringify(x[1]);
      result = result.replaceAll('"', ''); // remove quotation marks
      result = result.replaceAll(':', ': '); // add space after colon
      result = result.replaceAll(',', ', '); // add space after comma

      x[1] = result;
    });

    return entries;
  }
}
