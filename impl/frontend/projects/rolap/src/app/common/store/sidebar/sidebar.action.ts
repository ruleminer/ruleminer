import { createAction } from '@ngrx/store';

export const setSidebarWidth = createAction('[Sidebar] Set width', (params: { width: number; previous: number }) => ({
  width: params.width,
  previous: params.previous,
}));

export const setSidebarVisibility = createAction('[Sidebar] Set visibility', (value: boolean) => ({
  value,
}));
