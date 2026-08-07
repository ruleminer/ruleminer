import { inject, Injectable } from '@angular/core';
import { BaseIconsActionService } from './base-icons-action.service';
import { DatasetIconsActionService } from './impl/dataset-icons-action.service';
import { RulesetIconsActionService } from './impl/ruleset-icons-action.service';
import { ReportIconsActionService } from './impl/report-icons-action.service';


/**
 * Factory responsible for creating the appropriate `BaseIconsActionService`
 * instance based on the provided view type (ruleset or dataset).
 */
@Injectable({
  providedIn: 'root', 
})
export class IconsActionServiceFactory {
    /**
   * Creates and returns an instance of either `RulesetIconsActionService`
   * or `DatasetIconsActionService` based on the `tabType`.
   * @param tabType The tab type ('ruleSet' or 'dataSet' or 'report')
   * @returns An instance of BaseIconsActionService.
   * @throws Error if an unsupported view type is provided.
   */
  createService(tabType: 'ruleSet' | 'dataSet' | 'report'): BaseIconsActionService {
    switch (tabType) {
      case 'ruleSet':
        return inject(RulesetIconsActionService);
      case 'dataSet':
        return inject(DatasetIconsActionService);
      case 'report':
        return inject(ReportIconsActionService);
      default:
        throw new Error(`Unsupported view type: ${tabType}`);
    }
  }
}