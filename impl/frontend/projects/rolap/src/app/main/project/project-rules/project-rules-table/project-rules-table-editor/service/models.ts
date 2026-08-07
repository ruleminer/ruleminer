import { ValueChangedEvent } from 'devextreme/ui/filter_builder';

/**
 * State of rule editor, containing all the data needed to restore it to given state
 */
export interface RuleEditorState {
  conclusion: any;
  premiseChangeEvent: ValueChangedEvent;
}
