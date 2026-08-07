import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { nanoid } from 'nanoid';

import { V2Classify, V2ClassifyCard } from './types';
import { convertExampleTableToEntityState } from './utils';
import { V2ClassifyActions, V2ClassifyCardActions } from './v2Classify.action';

// Define an adapter and state for V2Classify
export const v2ClassifyAdapter: EntityAdapter<V2Classify> = createEntityAdapter<V2Classify>();
export type V2ClassifyState = EntityState<V2Classify>;

// Define an adapter and state for V2ClassifyCard
export const v2ClassifyCardAdapter: EntityAdapter<V2ClassifyCard> = createEntityAdapter<V2ClassifyCard>();
export type V2ClassifyCardState = EntityState<V2ClassifyCard>;

export const initialState: V2ClassifyState = v2ClassifyAdapter.getInitialState();
export const cardsInitialState: V2ClassifyCardState = v2ClassifyCardAdapter.getInitialState();

export const v2ClassifyReducer = createReducer(
  initialState,
  on(V2ClassifyActions.add, (state, action) => {
    return v2ClassifyAdapter.addOne(action.classify, state);
  }),
  on(V2ClassifyActions.remove, (state, action) => {
    return v2ClassifyAdapter.removeOne(action.key, state);
  }),
  on(V2ClassifyActions.removeAll, (state) => {
    return v2ClassifyAdapter.removeAll(state);
  }),

  //add
  on(V2ClassifyCardActions.add, (state) => state),

  on(V2ClassifyCardActions.addComplete, (state, { classifyKey, card }) => {
    const classifyState = state.entities[classifyKey];

    if (!classifyState) return state;
    // Add the new card
    const updatedCardsEntityState = v2ClassifyCardAdapter.addOne(card, classifyState.cards);

    // Update the cards in the state
    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  on(V2ClassifyCardActions.addEmptyCard, (state) => state),

  on(V2ClassifyCardActions.addEmptyCardComplete, (state, { classifyKey, card }) => {
    const classifyState = state.entities[classifyKey];

    if (!classifyState) {
      const classify = {
        id: classifyKey,
        cards: v2ClassifyCardAdapter.addOne(card, cardsInitialState),
      };

      return v2ClassifyAdapter.addOne(classify as V2Classify, state);
    }

    const updatedCardsEntityState = v2ClassifyCardAdapter.addOne(card, classifyState.cards);

    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  on(V2ClassifyCardActions.addRandomCard, (state) => state),

  on(V2ClassifyCardActions.addRandomCardComplete, (state, { classifyKey, card }) => {
    const classifyState = state.entities[classifyKey];

    if (!classifyState) {
      const classify = {
        id: classifyKey,
        cards: v2ClassifyCardAdapter.addOne(card, cardsInitialState),
      };

      return v2ClassifyAdapter.addOne(classify as V2Classify, state);
    }

    const updatedCardsEntityState = v2ClassifyCardAdapter.addOne(card, classifyState.cards);

    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  on(V2ClassifyCardActions.addByContextMenu, (state) => {
    return state;
  }),

  on(V2ClassifyCardActions.addRandomCard, (state) => state),

  on(V2ClassifyCardActions.addRandomCardComplete, (state, { classifyKey, card }) => {
    const classifyState = state.entities[classifyKey];

    if (!classifyState) {
      // Create a new classify object if it doesn't exist
      const classify = {
        id: classifyKey,
        cards: v2ClassifyCardAdapter.addOne(card, cardsInitialState),
      };

      return v2ClassifyAdapter.addOne(classify as V2Classify, state);
    }

    // Add the new card to existing classify
    const updatedCardsEntityState = v2ClassifyCardAdapter.addOne(card, classifyState.cards);

    // Update the cards in the state
    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  on(V2ClassifyCardActions.addByContextMenuComplete, (state, { classifyKey, selectedRows: selectedRows }) => {
    const classifyState = state.entities[classifyKey];

    const cardsObjects: V2ClassifyCard[] = [];

    for (let i = 0; i < selectedRows.length; i++) {
      const card: V2ClassifyCard = {
        id: nanoid(),
        exampleTable: [selectedRows[i]],
        exampleResult: undefined,
        showNeedsRecalculationInfo: false,
        calculatedBefore: false,
      };

      cardsObjects.push(card);
    }

    if (!classifyState) {
      // the code below is used when we go from the data set to the classification tab, and the tab with the rule set is not open
      const classify = {
        id: classifyKey,
        cards: {},
      };

      const cardsEntityState: EntityState<V2ClassifyCard> = convertExampleTableToEntityState(selectedRows);
      classify.cards = cardsEntityState;

      return v2ClassifyAdapter.addOne(classify as V2Classify, state);
    }

    const updatedCardsEntityState = v2ClassifyCardAdapter.setAll(cardsObjects, classifyState.cards);

    // Update the cards in the state
    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  //remove
  on(V2ClassifyCardActions.remove, (state) => {
    return state;
  }),

  on(V2ClassifyCardActions.removeComplete, (state, { classifyKey, key }) => {
    const classifyState = state.entities[classifyKey];

    if (!classifyState) return state;
    // Remove the card
    const updatedCardsEntityState = v2ClassifyCardAdapter.removeOne(key, classifyState.cards);

    // Update the cards in the state
    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  //Set example table
  on(V2ClassifyCardActions.setExampleTable, (state, action) => state),

  //set example table complete
  on(V2ClassifyCardActions.setExampleTableComplete, (state, { classifyKey, key, exampleTable }) => {
    const classifyState = state.entities[classifyKey];

    if (!classifyState) return state;
    // Update exampleTable in the card
    const updatedCardsEntityState = v2ClassifyCardAdapter.updateOne(
      {
        id: key,
        changes: {
          exampleTable,
          showNeedsRecalculationInfo: true,
          calculatedBefore: false,
        },
      },
      classifyState.cards,
    );

    // Update the cards in the state
    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  //recalculate
  on(V2ClassifyCardActions.recalculate, (state, action) => state),

  //recalculate complete
  on(V2ClassifyCardActions.recalculateComplete, (state, { classifyKey, key, result }) => {
    const classifyState = state.entities[classifyKey];

    if (!classifyState) return state;
    const updatedCardsEntityState = v2ClassifyCardAdapter.updateOne(
      {
        id: key,
        changes: {
          exampleResult: result,
          calculatedBefore: true,
        },
      },
      classifyState.cards,
    );

    // Update the cards in the state
    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),
  on(V2ClassifyCardActions.setShowNeedsRecalculationInfoToTrueForAllCurrent, (state) => state),
  on(V2ClassifyCardActions.setShowNeedsRecalculationInfoToTrueForAllCurrentComplete, (state, { key }) => {
    const classifyState = state.entities[key];
    if (!classifyState) return state;

    const updatedCardsEntityState = v2ClassifyCardAdapter.map(
      (card) => ({
        ...card,
        showNeedsRecalculationInfo: true,
      }),
      classifyState.cards,
    );

    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),
  on(V2ClassifyCardActions.setShowNeedsRecalculationInfoForTargetTable, (state, { targetTableKey }) => {
    const classifyState = state.entities[targetTableKey];
    if (!classifyState) return state;

    const updatedCardsEntityState = v2ClassifyCardAdapter.map(
      (card) => ({
        ...card,
        showNeedsRecalculationInfo: true,
      }),
      classifyState.cards,
    );

    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),

  on(V2ClassifyCardActions.setShowNeedsRecalculationInfo, (state, { classifyKey, key, showNeedsRecalculationInfo }) => {
    const classifyState = state.entities[classifyKey];
    if (!classifyState) return state;
    const updatedCardsEntityState = v2ClassifyCardAdapter.updateOne(
      {
        id: key,
        changes: {
          showNeedsRecalculationInfo: showNeedsRecalculationInfo,
        },
      },
      classifyState.cards,
    );

    // Update the cards in the state
    return v2ClassifyAdapter.setOne(
      {
        ...classifyState,
        cards: updatedCardsEntityState,
      },
      state,
    );
  }),
);
