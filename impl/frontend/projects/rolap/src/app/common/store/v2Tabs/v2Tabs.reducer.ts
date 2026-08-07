import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { V2Tab, V2TabStateInterface } from './types';
import { V2TabsActions } from './v2Tabs.action';

export const adapter: EntityAdapter<V2Tab | null> = createEntityAdapter<V2Tab | null>();

export const initialState: V2TabStateInterface = adapter.getInitialState();

export const v2TabsReducer = createReducer(
  initialState,
  on(V2TabsActions.closeAllTabs, (state) => {
    return adapter.removeAll(state);
  }),
  on(V2TabsActions.addTab, (state, action) => {
    return adapter.addOne(action.tab, state);
  }),
  on(V2TabsActions.closeTab, (state, action) => {
    return state;
  }),
  on(V2TabsActions.removeTab, (state, action) => {
    return adapter.removeOne(action.key, state);
  }),
  on(V2TabsActions.setCurrentTabDescription, (state, action) => {
    return state;
  }),
  on(V2TabsActions.setCurrentTabDescriptionComplete, (state, action) => {
    return adapter.updateOne({ id: action.key, changes: { description: action.description } }, state);
  }),
  on(V2TabsActions.setCurrentTabDescriptionAndName, (state, action) => {
    return state;
  }),
  on(V2TabsActions.setV2TabDescriptionAndNameComplete, (state, action) => {
    const changes: Partial<V2Tab> = { text: action.name };
    if (typeof action.description !== 'undefined') {
      changes.description = action.description;
    }
    return adapter.updateOne({ id: action.key, changes }, state);
  }),
  on(V2TabsActions.updateMultipleTabsDatasetText, (state, action) => {
    const updates = action.keys.map((key) => ({
      id: key,
      changes: { datasetText: action.datasetText },
    }));
    return adapter.updateMany(updates, state);
  }),
  on(V2TabsActions.setIsSaved, (state, action) => {
    return state;
  }),
  on(V2TabsActions.setIsSavedComplete, (state, action) => {
    return adapter.updateOne({ id: action.key, changes: { isSaved: action.isSaved } }, state);
  }),
  on(V2TabsActions.setCurrentSubTabIndex, (state, action) => state),
  on(V2TabsActions.setCurrentSubTabIndexBySubTabName, (state, action) => state),
  on(V2TabsActions.setCurrentSubTabIndexComplete, (state, action) => {
    return adapter.updateOne({ id: action.key, changes: { currentSubTabIndex: action.index } }, state);
  }),
);
