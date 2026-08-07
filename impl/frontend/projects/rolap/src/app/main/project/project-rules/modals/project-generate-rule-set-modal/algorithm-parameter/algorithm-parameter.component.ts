import { Component, DestroyRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

import { filter, switchMap } from 'rxjs';

import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { TranslateService } from '@ngx-translate/core';

import { ModalRef } from '../../../../../../common/services/modal/modal-ref';
import { ModalService } from '../../../../../../common/services/modal/modal.service';
import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { DatasetAttribute, DatasetAttributesRoles } from '../../../../dataset/models/dataset';
import { Parameter, RulesTableRow } from '../../../../models/project';
import { ProjectRulesTableEditorComponent } from '../../../project-rules-table/project-rules-table-editor/project-rules-table-editor.component';
import {
  RulesEditorDisplayTypes,
  RulesTableEditorModalSettings,
} from '../../../project-rules-table/project-rules-table-editor/types/rules-editor';
import { ExpertForbiddenAttributeSelectModalComponent } from '../expert-induction/expert-attribute/expert-forbidden-attribute-select-modal/expert-forbidden-attribute-select-modal.component';
import { ExpertPreferredAttributeSelectModalComponent } from '../expert-induction/expert-attribute/expert-preferred-attribute-select-modal/expert-preferred-attribute-select-modal.component';

interface ClassDistribution {
  [className: string]: number;
}

// TODO use this component also in non expert induction
@Component({
  selector: 'rolap-algorithm-parameter',
  templateUrl: './algorithm-parameter.component.html',
  styleUrls: ['./algorithm-parameter.component.scss'],
})
export class AlgorithmParameterComponent implements OnChanges {
  @Input({ required: true }) ids!: Ids;
  @Input({ required: true }) parameter!: Parameter;
  @Input({ required: true }) control!: AbstractControl;
  @Input({ required: true }) currentLanguage!: string;
  @Input({ required: true }) attributes!: DatasetAttribute[];
  @Input({ required: true }) problemType!: ProblemTypes;
  @Input({ required: true }) classDistribution!: ClassDistribution | null;

  public decisionAttributeName: string;
  public attributesSelectChoice: string[];
  public initialized = false;
  public readonly faPlus = faPlus;

  private modalService = inject(ModalService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attributes']) this.onAttributesChange();

    this.initialized = [this.parameter, this.control, this.currentLanguage, this.attributes].reduce(
      (prev, curr) => curr !== undefined && prev,
      true,
    );
  }

  public onExpertRuleOrConditionAddClick = () => {
    const modalTitle = this.translate.instant(`project.expert_induction.${this.parameter.name}_title`);
    const isExpertRule: boolean = this.parameter.name.includes('rules');
    const isForbidden: boolean = this.parameter.name.includes('forbidden');

    const size = {
      width: isExpertRule ? '100%' : '800px',
      height: isExpertRule ? '100%' : '520px',
    };
    const MODAL_SETTINGS: RulesTableEditorModalSettings = {
      ids: this.ids,
      autoIncrement: 1,
      uuid: '',
      decisionAttributeName: this.decisionAttributeName,
      displayType: this.determineRulesEditorConfigForExpertParamsEdition(isExpertRule, isForbidden),
    };
    this.modalService
      .open(ProjectRulesTableEditorComponent, modalTitle, size.width, size.height, { MODAL_SETTINGS })
      .pipe(
        switchMap((modalRef: ModalRef<ProjectRulesTableEditorComponent>) =>
          modalRef.getResult<any>().pipe(filter((res) => res !== undefined)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res: { ruleTableRow: RulesTableRow; class?: string[] }) => {
        let result: any;
        if (this.problemType === ProblemTypes.Classification) {
          result = this.control.value ? { ...this.control.value } : {};
          const classNames = res.class ? res.class : [res.ruleTableRow.conclusion.value];
          classNames.forEach((className) => {
            if (className in result) {
              result[className].push(res.ruleTableRow);
            } else {
              result[className] = [res.ruleTableRow];
            }
          });
        } else {
          // We must set NaN as the conclusion value for non classification problems
          res.ruleTableRow.conclusion = { ...res.ruleTableRow.conclusion, value: 'NaN' };
          result = this.control.value ? [...this.control.value] : [];
          result.push(res.ruleTableRow);
        }
        this.control.setValue(result);
      });
  };

  public onExpertAttributeAddClick = () => {
    if (this.parameter.name.includes('preferred')) return this.openPreferredAttributesParamSelectModal();
    this.openForbiddenAttributesParamSelectModal();
  };

  private determineRulesEditorConfigForExpertParamsEdition(
    isExpertRule: boolean,
    isForbidden: boolean,
  ): RulesEditorDisplayTypes {
    if (isExpertRule && isForbidden) throw new Error('isForbidden cannot be used together with expert rules');
    if (isExpertRule) return RulesEditorDisplayTypes.EXPERT_RULES;
    return isForbidden
      ? RulesEditorDisplayTypes.EXPERT_FORBIDDEN_CONDITIONS
      : RulesEditorDisplayTypes.EXPERT_PREFERRED_CONDITIONS;
  }

  private openPreferredAttributesParamSelectModal() {
    this.openAttributesParamSelectModal(
      ExpertPreferredAttributeSelectModalComponent,
      this.translate.instant('project.expert_induction.expert_preferred_attributes_title'),
    );
  }

  private openForbiddenAttributesParamSelectModal() {
    this.openAttributesParamSelectModal(
      ExpertForbiddenAttributeSelectModalComponent,
      this.translate.instant('project.expert_induction.expert_forbidden_attributes_title'),
    );
  }

  private openAttributesParamSelectModal(componentClass: any, title: string) {
    this.modalService
      .open(componentClass, title, undefined, undefined, {
        attributesChoice: this.attributesSelectChoice,
        selectedAttributes: this.control.value,
        problemType: this.problemType,
        classDistribution: this.classDistribution,
      })
      .pipe(
        switchMap((modalRef: ModalRef<typeof componentClass>) =>
          modalRef.getResult().pipe(filter((res) => res !== undefined)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.control.setValue(value);
      });
  }

  private onAttributesChange() {
    if (!this.attributes) return;
    const decisionAttribute: DatasetAttribute | undefined = this.attributes.find(
      (attribute) => attribute.role === DatasetAttributesRoles.LABEL,
    );
    if (!decisionAttribute) throw new Error('Label attribute not specified for dataset');
    this.decisionAttributeName = decisionAttribute.name;
    this.attributesSelectChoice = this.attributes
      .filter((attribute) => attribute.role === DatasetAttributesRoles.ATTRIBUTE)
      .map((attribute) => attribute.name);
  }
}
