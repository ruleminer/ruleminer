import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Subject, filter, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { FieldName } from '../../../../../../../common/components/validation-message/validation-message.component';
import { settingsSuffix } from '../const';
import { ChoiceItem, ReportFormData, ReportFormMeta, ReportFormMetaType } from './report-form-meta';

@Component({
  selector: 'rolap-report-form',
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFormComponent implements OnChanges, OnInit, OnDestroy {
  @Input() data: ReportFormData;

  public readonly ReportFormUnitType = ReportFormMetaType;
  public readonly FieldName = FieldName;

  private ngUnsubscribe = new Subject<void>();
  protected choicesMap: Record<string, ChoiceItem[]> = {};
  protected tooltipsMap: Record<string, string> = {};
  protected formGroupsMap: Record<string, FormGroup> = {};

  constructor(private changeDetector: ChangeDetectorRef, protected translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.preprocessFormMeta();
      this.changeDetector.detectChanges();
    }
  }

  ngOnInit(): void {
    this.translate.onLangChange
      .pipe(
        filter(() => !!this.data),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(() => {
        this.preprocessFormMeta();
        this.changeDetector.detectChanges();
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public preprocessFormMeta(): void {
    this.tooltipsMap = {};
    this.choicesMap = {};
    this.formGroupsMap = {};

    this.processFormMetaRecursively(this.data.formMeta, this.data.reportFormGroup);
  }

  public onSectionSwitchValueChange(formGroup: FormGroup, sectionName: string): void {
    // Disable settings section if the corresponding switch is off
    const settingsSectionName = sectionName + settingsSuffix;
    const settingsSection = formGroup.get(settingsSectionName);
    if (!settingsSection) throw new Error('Settings section not found in report form.');
    const sectionSwitch = formGroup.get(sectionName)!;
    const shouldDisable = !sectionSwitch.value;
    if (shouldDisable) {
      settingsSection.disable();
    } else {
      settingsSection.enable();
    }
  }

  private processFormMetaRecursively(formMeta: ReportFormMeta[], formGroup: FormGroup): void {
    formMeta.forEach((meta) => {
      const tooltip = this.getTooltip(meta.name);
      if (tooltip) {
        this.tooltipsMap[meta.name] = tooltip;
      }
      if (!meta.properties) {
        const choices = this.generateChoices(meta);
        if (choices) {
          this.choicesMap[meta.name] = choices;
        }
      } else {
        const sectionFormGroup = formGroup.get(meta.name) as FormGroup;
        this.formGroupsMap[meta.name] = sectionFormGroup;
        this.processFormMetaRecursively(meta.properties, sectionFormGroup);
      }
    });
  }

  private generateChoices(meta: ReportFormMeta): ChoiceItem[] | undefined {
    // Generate array of choices objects with values and translated names for each enum field
    // upon component initialization
    if (meta.type !== ReportFormMetaType.ENUM) return;

    if (!meta.options) {
      throw new Error(`Options not found in report form meta for given ENUM field named "${meta.name}".`);
    }
    return meta.options.map((item) => {
      return {
        value: item,
        name: this.translate.instant('project.treeview.context_menu.modal.generate_reports.' + item),
      };
    });
  }

  private getTooltip(name: string): string | undefined {
    const key = 'project.treeview.context_menu.modal.generate_reports.tooltips.' + name;
    const tooltip = this.translate.instant(key);
    return tooltip !== key ? tooltip : undefined;
  }
}
