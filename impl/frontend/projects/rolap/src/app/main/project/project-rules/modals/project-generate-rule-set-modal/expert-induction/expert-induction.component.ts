import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subject, Subscription, takeUntil } from 'rxjs';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Ids } from 'projects/rolap/src/app/common/store/ruleSets/rulesets.selectors';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { DatasetAttribute } from '../../../../dataset/models/dataset';
import { Parameter } from '../../../../models/project';
import { NewRow } from '../../../../models/ruleset';
import { ExpertClassificationParamValue, isExpertParamValueForClassification } from './expert-parameter-display/types';

@Component({
  selector: 'rolap-expert-induction',
  templateUrl: './expert-induction.component.html',
  styleUrls: ['./expert-induction.component.scss'],
})
export class ExpertInductionComponent implements OnDestroy, OnChanges {
  @Input() ids: Ids;
  @Input() expertParameters: Parameter[];
  @Input() decisionAttributeName: string | undefined;
  @Input() attributes: DatasetAttribute[];
  @Input() problemType: ProblemTypes;
  @Input() classDistribution: { [className: string]: number } | null;
  @Output() formChange: EventEmitter<{ [parameterName: string]: any }> = new EventEmitter();

  public expertParamsGroup: FormGroup;
  public isExpertsInduction = false;
  public isExpanded = false;
  public currentLanguage: string;

  public expertsInductionFields: { [key: string]: string[] } = {};

  private ngUnsubscribe: Subject<void> = new Subject();
  private formSubscription: Subscription;

  constructor(private fb: FormBuilder, private translate: TranslateService) {
    this.setupCurrentLanguage();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expertParameters'] && this.expertParameters) this.setupForm();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.formSubscription.unsubscribe();
  }

  public onSwitchValueChange(checked: boolean): void {
    this.isExpanded = checked;
    this.isExpertsInduction = this.isExpanded;
    this.formChange.emit(checked ? this.prepareFormDataBeforeEmit(this.expertParamsGroup.value) : undefined);
  }

  private setupCurrentLanguage() {
    this.currentLanguage = this.translate.currentLang;
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe((event: LangChangeEvent) => {
      this.currentLanguage = event.lang;
    });
  }

  private prepareFormDataBeforeEmit(data: { [paramName: string]: any }): { [paramName: string]: any } {
    data = { ...data };

    Object.keys(data).forEach((paramName: string) => {
      const parameter: Parameter | undefined = this.expertParameters.find((param) => param.name === paramName);
      if (!parameter) throw new Error(`Parameter ${paramName} not found`);
      if (parameter.parameter_type === 'expert_conditions') {
        // for expert conditions parameter emit only the premise part of the rule
        data[paramName] = this.prepareExpertConditionsParameter(data[paramName], parameter);
      }
      if (parameter.parameter_type === 'expert_rules') {
        // for expert rules for classification problem we drop the decision class grouping
        data[paramName] = this.prepareExpertRulesParameter(data[paramName], parameter);
      }
      if (parameter.parameter_type === 'expert_attributes') {
        data[paramName] = this.prepareExpertAttributesParameter(data[paramName], parameter);
      }
    });
    return data;
  }

  private prepareExpertConditionsParameter(
    parameterValue: NewRow[] | ExpertClassificationParamValue<NewRow[]>,
    parameter: Parameter,
  ) {
    if (parameterValue === null || parameterValue === undefined) {
      parameterValue = this.getParameterCastedDefaultValue(parameter);
    }
    if (isExpertParamValueForClassification(parameterValue)) {
      const preparedParamValue: ExpertClassificationParamValue<any[]> = {};
      Object.entries(parameterValue).forEach(([key, value]) => {
        preparedParamValue[key] = value.map((row: NewRow) => row.premise as any);
      });
      return preparedParamValue;
    }
    /*
    For non classification problems, where there are not classes we return similar 
    object but with a single field "NaN". This strange format is necessary for compatibility
    with the backend.
    */
    return {
      NaN: (parameterValue as NewRow[]).map((row: NewRow) => row.premise),
    };
  }

  private prepareExpertRulesParameter(
    parameterValue: NewRow[] | ExpertClassificationParamValue<NewRow[]>,
    parameter: Parameter,
  ) {
    if (parameterValue === null || parameterValue === undefined) {
      parameterValue = this.getParameterCastedDefaultValue(parameter);
    }
    if (isExpertParamValueForClassification(parameterValue)) {
      return Object.values(parameterValue).reduce((prev: any[], curr: any[]) => prev.concat(curr), []);
    }
    return parameterValue;
  }

  private prepareExpertAttributesParameter(
    parameterValue: string[] | ExpertClassificationParamValue<string[]>,
    parameter: Parameter,
  ) {
    if (parameterValue === null || parameterValue === undefined) {
      parameterValue = this.getParameterCastedDefaultValue(parameter);
    }
    if (this.problemType === ProblemTypes.Classification) {
      return parameterValue;
    }

    /*
    For non classification problems, where there are not classes we return similar 
    object but with a single field "NaN". This strange format is necessary for compatibility
    with the backend.
    */
    return { NaN: parameterValue };
  }

  private setupForm() {
    this.formSubscription?.unsubscribe();

    const formObject: { [parameterName: string]: any } = {};
    this.expertParameters.forEach((parameter) => {
      formObject[parameter.name] = this.getParameterCastedDefaultValue(parameter);
    });
    this.expertParamsGroup = this.fb.group(formObject);

    this.formSubscription = this.expertParamsGroup.valueChanges.subscribe(() => {
      if (!this.isExpertsInduction) this.formChange.emit(undefined);
      const preparedData = this.prepareFormDataBeforeEmit(this.expertParamsGroup.value);
      this.formChange.emit(preparedData);
    });
  }

  private getParameterCastedDefaultValue(parameter: Parameter): any {
    switch (parameter.parameter_type) {
      case 'int':
        return Number.parseInt(parameter.default_value);
      case 'float':
        return Number.parseFloat(parameter.default_value);
      case 'bool':
        if (typeof parameter.default_value === 'string') {
          return parameter.default_value.toLowerCase() === 'true';
        }
        return parameter.default_value;
      case 'expert_rules':
        return [];
      case 'expert_attributes':
        // for classification problem attributes and conditions should are grouped by decision class
        if (parameter.name.includes('preferred') || this.problemType === ProblemTypes.Classification) return {};
        return [];
      case 'expert_conditions':
        // for classification problem attributes and conditions should are grouped by decision class
        if (this.problemType === ProblemTypes.Classification) return {};
        return [];
      default:
        throw new Error(`Unsupported parameter type: ${parameter.parameter_type}`);
    }
  }
}
