import { EntityState } from '@ngrx/entity';
import { nanoid } from 'nanoid';

import { V2ClassifyCard } from './types';

export function convertExampleTableToEntityState(exampleTable: Record<string, any>[]): EntityState<V2ClassifyCard> {
  const entities: { [id: string]: V2ClassifyCard } = {};
  const ids: string[] = [];

  exampleTable.forEach((example, index) => {
    const cardId = nanoid();
    ids.push(cardId);
    entities[cardId] = {
      id: cardId,
      exampleTable: [example],
      exampleResult: undefined,
      showNeedsRecalculationInfo: false,
      calculatedBefore: false,
    };
  });

  return {
    ids,
    entities,
  };
}

export function castExampleAttributesToCorrectTypes(
  example: { [key: string]: any },
  columnsTypes: Map<string, string>,
): { [key: string]: any } {
  const castedExample = { ...example };
  Object.keys(castedExample).forEach((attributeName: string) => {
    switch (columnsTypes.get(attributeName)) {
      case 'cat':
        castedExample[attributeName] = castedExample[attributeName]?.toString() || '';
        break;
      case 'num':
        castedExample[attributeName] = parseFloat(castedExample[attributeName] as string);
        break;
    }
  });
  return castedExample;
}
