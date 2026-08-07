import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { Premise, Rule } from '../../../../models/ruleset';
import { DataField } from '../../../../service/models/rules-customize-columns-api';

// Enum representing the possible subcondition types. Replaces previous string union type.
export enum SubconditionType {
  ElementaryNominal = 'elementary_nominal',
  ElementaryNumerical = 'elementary_numerical',
  Compound = 'compound',
  Attributes = 'attributes',
  NominalAttributesEquality = 'nominal_attributes_equality',
}

export interface Subcondition {
  type: SubconditionType;
  attributes: number[];
  negated: boolean;
  left: number | null;
  right: number | null;
  left_closed: boolean;
  right_closed: boolean;
  value?: string | number;
  refine?: boolean;
  subconditions?: Subcondition[];
}

export type FilterOperations = '=' | '<>' | '<' | '>' | '<=' | '>=' | 'between';

export type Operator = 'CONJUNCTION' | 'ALTERNATIVE';

export type Condition = [number, string, string] | 'and' | 'or';

export type ConditionGroup = (Condition | ConditionGroup)[];

export type NominalAttributes<T> = {
  [key: string]: T[];
};

export enum RulesEditorDisplayTypes {
  RULE_ADDING_STORE = 'rule_adding_store',
  RULE_ADDING_BACKEND = 'rule_adding_backend',
  RULE_EDITING = 'rule_editing',
  RULE_EDITING_NOT_COVERED = 'rule_editing_not_covered',
  EXPERT_RULES = 'export_rules',
  EXPERT_PREFERRED_CONDITIONS = 'export_preferred_conditions',
  EXPERT_FORBIDDEN_CONDITIONS = 'forbidden_conditions',
}

export type RulesEditorConfig = {
  isManually: boolean;
  isEdit: boolean;
  isCondition: boolean;
  isExpertRules: boolean;
  isForbidden: boolean;

  useScrollView: boolean;
  shouldShowSidePanel: boolean;
};

interface ExpertRulePremise extends Premise {
  number: number | string;
}

export interface ExpertRule extends Rule {
  premise: ExpertRulePremise;
}

export interface RulesTableEditorModalSettings {
  displayType: RulesEditorDisplayTypes;
  ids: Ids;
  selectedRow?: Record<DataField, any>;
  autoIncrement: number;
  uuid: string;
  decisionAttributeName: string;
}
