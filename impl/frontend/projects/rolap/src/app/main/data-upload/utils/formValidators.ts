import { Validators } from '@angular/forms';

const genericNamePattern = /^[A-Za-zżźćńółęąśŻŹĆŃÓŁĘĄŚ0-9\s\-_[\]]+$/;

export const CustomTitleDatasetValidation = [
  Validators.required,
  Validators.pattern(genericNamePattern),
  Validators.maxLength(50),
  Validators.minLength(3),
];

export const CustomDescriptionDatasetValidation = [Validators.maxLength(1000), Validators.minLength(1)];

export const CustomTitleRuleSetValidation = [
  Validators.required,
  Validators.pattern(genericNamePattern),
  Validators.minLength(3),
  Validators.maxLength(75),
];

export const CustomDescriptionRuleSetValidation = [...CustomDescriptionDatasetValidation];

export const CustomSplitRatioValidation = [Validators.required, Validators.min(1), Validators.max(100)];

export const CustomSplitTestValidation = [
  Validators.required,
  Validators.pattern(genericNamePattern),
  Validators.minLength(1),
  Validators.maxLength(50),
];

export const CustomSplitTrainValidation = [
  Validators.required,
  Validators.pattern(genericNamePattern),
  Validators.minLength(1),
  Validators.maxLength(50),
];

export const CustomProjectNameValidation = [
  Validators.pattern(genericNamePattern),
  Validators.required,
  Validators.minLength(1),
  Validators.maxLength(50),
];

export const CustomProjectDescriptionValidation = [Validators.minLength(1), Validators.maxLength(1000)];

export const CustomReportNameValidation = [
  Validators.required,
  Validators.pattern(genericNamePattern),
  Validators.minLength(1),
  Validators.maxLength(75),
];
