import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ReportFormMeta, ReportFormMetaType } from './report-form-meta';

export function buildReportFormSchema(schemaProperties: ReportFormMeta[], startDisabled = false): FormGroup {
  const group: { [key: string]: FormControl | FormGroup } = {};
  for (const entry of schemaProperties) {
    if (entry.type === ReportFormMetaType.SECTION) {
      const sectionDisabled = checkSectionDisabled(entry, schemaProperties);
      group[entry.name] = buildReportFormSchema(entry.properties!, sectionDisabled);
    } else {
      group[entry.name] = handleReportField(entry);
    }
  }
  const formGroup = new FormGroup(group);
  if (startDisabled) {
    formGroup.disable();
  }
  return formGroup;
}

function handleReportField(entry: ReportFormMeta): FormControl {
  const validators = [];
  if (entry.required || !entry.nullable) {
    validators.push(Validators.required);
  }
  if (entry.ge) {
    validators.push(Validators.min(entry.ge!));
  }
  if (entry.le) {
    validators.push(Validators.max(entry.le!));
  }
  const fC = new FormControl(entry.default, validators);
  if (entry.fixed!) {
    fC.disable();
  }
  return fC;
}

function checkSectionDisabled(entry: ReportFormMeta, schemaProperties: ReportFormMeta[]): boolean {
  if (entry.isSettings) {
    const sectionName = entry.name.replace('_settings', '');
    const settingsSection = schemaProperties.find((e) => e.name === sectionName);
    if (settingsSection) {
      return !settingsSection.default;
    }
  }
  return false;
}
