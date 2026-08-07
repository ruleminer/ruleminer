import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    /**
     * This actions should be used instead of ROOT_EFFECTS_INIT for effects performing
     * some API requests. ROOT_EFFECTS_INIT cannot be safely used in such cases as it usually
     * triggers before use access token is successfully obtained.
     */
    Initialized: emptyProps(),

    /** Request to load user profile from Keycloak */
    'Load User Profile': emptyProps(),

    /** User profile successfully loaded with userId */
    'User Profile Loaded': props<{ userId: string }>(),

    /** User profile loading failed */
    'User Profile Load Error': props<{ error: any }>(),

    /** Clear the entire store state */
    'Clear Store': emptyProps(),
  },
});
