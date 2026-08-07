import { ValueChangedEvent } from 'devextreme/ui/check_box';
import { ValueChangedEvent as ValueChangedEventSelectBox } from 'devextreme/ui/select_box';

export const isNotCausedByUserEvent = (
  e: ValueChangedEvent | ValueChangedEventSelectBox | ValueChangedEvent,
): boolean => {
  return !e || !e.event || e.event === undefined || e.event.type !== 'dxclick';
};
