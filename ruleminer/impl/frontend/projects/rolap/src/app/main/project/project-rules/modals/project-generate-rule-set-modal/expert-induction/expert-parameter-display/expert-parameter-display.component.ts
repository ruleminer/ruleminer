import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { Subscription } from 'rxjs';

import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { removeIfAndThenFromRule } from '../../../../../../../common/store/ruleSets/rulesets.reducer';
import { NewRow } from '../../../../../models/ruleset';
import {
  ExpertClassificationParamValue,
  ExpertParamValue,
  ExpertParamValueWithOccurrences,
  isExpertParamValue,
  isExpertParamValueForClassification,
  isExpertParamValueForClassificationWithOccurrences,
  isExpertParamValueWithOccurrences,
} from './types';

type ParameterValue =
  | any[]
  | ExpertClassificationParamValue<any[]>
  | ExpertParamValueWithOccurrences
  | ExpertClassificationParamValue<ExpertParamValueWithOccurrences>;

interface DisplayItem {
  displayString: string;
  itemKey: string | number;
}

@Component({
  selector: 'rolap-expert-parameter-display',
  templateUrl: './expert-parameter-display.component.html',
  styleUrls: ['./expert-parameter-display.component.scss'],
})
export class ExpertParameterDisplayComponent implements OnChanges, OnDestroy {
  @Input() control: AbstractControl;
  @Input() parameterType: string;
  @Input() problemType: ProblemTypes;
  @Output() removeButtonClick: EventEmitter<any> = new EventEmitter();

  public displayData: DisplayItem[] | ExpertClassificationParamValue<DisplayItem[]>;
  public sectionVisibleFlags: { [decisionClass: string]: boolean } = {};
  public parameterValueToStringMappers: { [parameterType: string]: (...args: any[]) => string } = {
    expert_attributes: (attributeName: string, occurrenceCount?: number) => {
      return `${attributeName}${occurrenceCount ? ` (${occurrenceCount})` : ''}`;
    },
    expert_conditions: (condition: NewRow) => removeIfAndThenFromRule(condition.string),
    expert_rules: (condition: NewRow) => condition.string,
  };
  public ProblemTypes = ProblemTypes;
  public faXMark = faXmark;
  private controlValueChangesSubscription: Subscription;

  ngOnChanges(): void {
    if (!this.control || !this.problemType) return;

    this.controlValueChangesSubscription?.unsubscribe();
    this.controlValueChangesSubscription = this.control.valueChanges.subscribe((parameterValue: ParameterValue) => {
      this.prepareDisplayData(parameterValue);
    });
  }

  ngOnDestroy(): void {
    this.controlValueChangesSubscription?.unsubscribe();
  }

  public onRemoveButtonClick(item: DisplayItem, decisionClass?: string) {
    const parameterValue: ParameterValue = this.control.value;
    let newControlValue: any = null;
    if (isExpertParamValue(parameterValue)) {
      newControlValue = parameterValue as ExpertParamValue;
      newControlValue.splice(item.itemKey as number, 1);
    } else if (isExpertParamValueWithOccurrences(parameterValue)) {
      newControlValue = { ...(parameterValue as ExpertParamValueWithOccurrences) };
      delete newControlValue[item.itemKey];
    } else if (isExpertParamValueForClassification(parameterValue) && decisionClass) {
      newControlValue = { ...(parameterValue as ExpertParamValueWithOccurrences) };
      newControlValue[decisionClass].splice(item.itemKey as number, 1);
    } else if (isExpertParamValueForClassificationWithOccurrences(parameterValue) && decisionClass) {
      newControlValue = { ...(parameterValue as ExpertParamValueWithOccurrences) };
      delete newControlValue[decisionClass][item.itemKey];
    }
    if (newControlValue === null) throw new Error('Unknown parameter type');
    this.control.setValue(newControlValue);
  }

  private prepareDisplayData(parameterValue: ParameterValue) {
    if (this.problemType === ProblemTypes.Classification) {
      this.displayData = this.prepareDisplayDataForClassification(parameterValue);
      return;
    }
    this.displayData = this.prepareDisplayDataForSingleClass(parameterValue as any);
  }

  private prepareDisplayDataForClassification(
    parameterValue: ParameterValue,
  ): ExpertClassificationParamValue<DisplayItem[]> {
    const sectionVisibleFlags: { [decisionClass: string]: boolean } = {};
    const displayData: ExpertClassificationParamValue<DisplayItem[]> = {};
    Object.keys(parameterValue).forEach((decisionClass: string) => {
      const elements: DisplayItem[] = this.prepareDisplayDataForSingleClass(
        (parameterValue as ExpertClassificationParamValue<any>)[decisionClass],
      );
      // do not display classes with no elements
      if (elements.length > 0) {
        sectionVisibleFlags[decisionClass] = false;
        displayData[decisionClass] = elements;
      }
    });
    this.restoreSectionsVisibilityState(sectionVisibleFlags);
    this.sectionVisibleFlags = sectionVisibleFlags;
    return displayData;
  }

  private prepareDisplayDataForSingleClass(value: ExpertParamValue | ExpertParamValueWithOccurrences): DisplayItem[] {
    if (isExpertParamValue(value)) {
      return (value as ExpertParamValue).map((e, i) => ({
        displayString: this.mapParameterValueToStringMapper(e),
        itemKey: i,
      }));
    }
    if (isExpertParamValueWithOccurrences(value)) {
      return Object.entries(value as ExpertParamValueWithOccurrences).map(([key, occurrence]) => ({
        displayString: this.mapParameterValueToStringMapper(key, occurrence),
        itemKey: key,
      }));
    }
    throw new Error('Unsupported value type');
  }

  private mapParameterValueToStringMapper(...args: any[]): string {
    if (!(this.parameterType in this.parameterValueToStringMappers))
      throw new Error(`Unsupported parameter type: "${this.parameterType}"`);
    return this.parameterValueToStringMappers[this.parameterType](...args);
  }

  private restoreSectionsVisibilityState(newSectionVisibleFlags: { [decisionClass: string]: boolean }) {
    Object.keys(this.sectionVisibleFlags).forEach((decisionClass: string) => {
      if (decisionClass in newSectionVisibleFlags) {
        newSectionVisibleFlags[decisionClass] = this.sectionVisibleFlags[decisionClass];
      }
    });
  }
}
