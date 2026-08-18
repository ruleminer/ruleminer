import { HttpClient } from '@angular/common/http';

import { Action, ActionReducer, ActionReducerMap, MetaReducer, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { KeycloakService } from 'keycloak-angular';
import { localStorageSync } from 'ngrx-store-localstorage';

import { environment } from '../environments/environment';
import { AppState } from './common/store/app-state.model';
import { attributesReducer } from './common/store/attributes/attributes.reducer';
import { AuthActions } from './common/store/auth/auth.action';
import { authReducer } from './common/store/auth/auth.reducer';
import { bugReportReducer } from './common/store/bugReport/bugReport.reducer';
import { indicatorsMetaReducer } from './common/store/indicatorsMeta/indicatorsMeta.reducer';
import { labelsReducer } from './common/store/labels/labels.reducer';
import { LimitReducer } from './common/store/limits/limits.reducer';
import { predictionConfigOptionsReducer } from './common/store/predictionConfigOptions/predictionConfigOptions.reducer';
import { projectReducer } from './common/store/project/project.reducer';
import { projectSearchReducer } from './common/store/projectSearch/projectSearch.reducer';
import { tabReducer } from './common/store/ruleSets/rulesets.reducer';
import { sidebarReducer } from './common/store/sidebar/sidebar.reducer';
import { tourReducer } from './common/store/tour/tour.reducer';
import { v2ClassifyReducer } from './common/store/v2Classify/v2Classify.reducer';
import { v2ComparisonReducer } from './common/store/v2Comparison/v2Comparison.reducer';
import { v2CurrentTabReducer } from './common/store/v2CurrentTab/v2CurrentTab.reducer';
import { v2DataSetTableReducer } from './common/store/v2DataSetTable/v2DataSetTable.reducer';
import { v2DetailsOfRuleSetGenerationReducer } from './common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.reducer';
import { V2PredictionQualityTabReducer } from './common/store/v2PredictionQualityTab/v2PredictionQualityTab.reducer';
import { V2PredictionTabReducer } from './common/store/v2PredictionTab/v2PredictionTab.reducer';
import { v2RulesCoverageTabReducer } from './common/store/v2RulesCoverageTab/v2RulesCoverageTab.reducer';
import { v2RulesTableReducer } from './common/store/v2RulesTable/v2RulesTable.reducer';
import { v2StatisticsTabReducer } from './common/store/v2StatisticsTab/v2StatisticsTab.reducer';
import { v2TabsReducer } from './common/store/v2Tabs/v2Tabs.reducer';
import { v2VisualizationTabReducer } from './common/store/v2VisualizationTab/v2VisualizationTab.reducer';
import { versionReducer } from './common/store/version/version.reducer';

export const AVAILABLE_LANGUAGES = ['en', 'pl'];
export const DEFAULT_LANGUAGE = 'en';

export const reducers = {
  version: versionReducer,
  bugReport: bugReportReducer,
  auth: authReducer,
  tabs: tabReducer,
  sidebar: sidebarReducer,
  labels: labelsReducer,
  project: projectReducer,
  limits: LimitReducer,
  predictionConfigOptions: predictionConfigOptionsReducer,
  v2CurrentTab: v2CurrentTabReducer,
  v2Tabs: v2TabsReducer,
  v2Classify: v2ClassifyReducer,
  v2RulesTable: v2RulesTableReducer,
  v2PredictionQualityTab: V2PredictionQualityTabReducer,
  v2PredictionTab: V2PredictionTabReducer,
  v2StatisticsTab: v2StatisticsTabReducer,
  v2DetailsOfRuleSetGeneration: v2DetailsOfRuleSetGenerationReducer,
  v2RulesCoverageTab: v2RulesCoverageTabReducer,
  v2ComparisonTab: v2ComparisonReducer,
  v2DataSetTable: v2DataSetTableReducer,
  v2VisualizationTab: v2VisualizationTabReducer,
  projectSearch: projectSearchReducer,
  attributes: attributesReducer,
  tour: tourReducer,
  indicatorsMeta: indicatorsMetaReducer,
} as ActionReducerMap<AppState>;

/**
 * Meta-reducer to clear the entire store state on (user id change)
 */
export function clearStateMetaReducer<State extends {}>(reducer: ActionReducer<State>): ActionReducer<State> {
  return function clearStateFn(state: State | undefined, action: Action) {
    if (state === undefined) {
      return reducer(state, action);
    }

    if (action.type === '[Auth] Clear Store') {
      state = {} as State;
    }
    return reducer(state, action);
  };
}

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return localStorageSync({
    keys: [
      'version',
      'tabs',
      'labels',
      'limits',
      'predictionConfigOptions',
      'v2CurrentTab',
      'v2Tabs',
      'v2Classify',
      'v2RulesTable',
      'v2Name',
      'v2PredictionQualityTab',
      'v2PredictionTab',
      'v2DetailsOfRuleSetGeneration',
      'v2RulesCoverageTab',
      'v2ComparisonTab',
      'v2DataSetTable',
      'v2VisualizationTab',
      { sidebar: ['width'] },
      'project',
      'projectSearch',
      'attributes',
      'tour',
      'auth',
      'indicatorsMeta',
    ],
    rehydrate: true,
  })(reducer);
}

export const metaReducers: Array<MetaReducer<any, any>> = [clearStateMetaReducer, localStorageSyncReducer];

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function getDefaultLanguage(translate: TranslateService): string {
  const browserLang = translate.getBrowserLang();

  if (AVAILABLE_LANGUAGES.includes(browserLang!)) {
    return browserLang!;
  } else {
    return DEFAULT_LANGUAGE;
  }
}

export function initializeKeycloak(keycloak: KeycloakService, store: Store<AppState>) {
  return () => {
    const authorized: Promise<boolean> = keycloak.init({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId,
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false,
      },
    });
    // All effects triggered by the ROOT_EFFECTS_INIT action that execute the request
    // fails because the user access token is not yet set. This code set a special flag
    // in store indicating that token is ready and requests will be authorized.
    authorized.then(() => store.dispatch(AuthActions.initialized()));

    return authorized;
  };
}
