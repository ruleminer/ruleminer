export enum ConditionsCheckboxesTypes {
  refine = 'refine', // refine given condition values
  determine = 'determine', // determine best values for given condition
}

export type ConditionCheckboxChangeEvent = {
  index: number;
  type: ConditionsCheckboxesTypes;
  value: boolean;
};

export type ConditionsCheckboxesModel = Record<ConditionsCheckboxesTypes, boolean[]>;
