export type ExpertClassificationParamValue<T> = { [decisionClass: string]: T };

export type ExpertParamValue = any[];
export type ExpertParamValueWithOccurrences = { [key: string]: number };

export function isExpertParamValue(value: any): boolean {
  return Array.isArray(value);
}

function isObject(value: any): boolean {
  return typeof value === 'object' && !Array.isArray(value);
}

export function isExpertParamValueWithOccurrences(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  // check if all values are numbers
  return Object.values(value).reduce((prev, curr) => prev && typeof curr === 'number', true) as boolean;
}

export function isExpertParamValueForClassification(value: any): boolean {
  if (!value || !isObject(value)) return false;
  return Object.keys(value).reduce((prev, curr) => {
    return prev && isExpertParamValue(value[curr]);
  }, true);
}

export function isExpertParamValueForClassificationWithOccurrences(value: any): boolean {
  if (!value || !isObject(value)) return false;
  return Object.keys(value).reduce((prev, curr) => {
    return prev && isExpertParamValueWithOccurrences(value[curr]);
  }, true);
}
