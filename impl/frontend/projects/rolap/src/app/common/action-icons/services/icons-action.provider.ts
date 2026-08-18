import { Provider, InjectionToken, Injector } from '@angular/core';
import { BaseIconsActionService } from './base-icons-action.service';
import { Store } from '@ngrx/store';
import { selectCurrentV2TabType } from '../../store/v2Tabs/v2Tabs.selectors';
import { IconsActionServiceFactory } from './icons-action.factory';
import { AppState } from '../../store/app-state.model';

export const ICONS_ACTION_SERVICE_TOKEN = new InjectionToken<BaseIconsActionService>('BaseIconsActionService');

export const iconsActionServiceProvider: Provider = {
  provide: ICONS_ACTION_SERVICE_TOKEN,
  useFactory: (injector: Injector): BaseIconsActionService => {
        const store = injector.get(Store<AppState>);
        const iconsActionServiceFactory = injector.get(IconsActionServiceFactory);
          const currentViewTypeSignal = store.selectSignal(selectCurrentV2TabType);
          const currentViewType = currentViewTypeSignal();
      
          return iconsActionServiceFactory.createService(currentViewType as 'ruleSet' | 'dataSet' | 'report');
        },
        deps: [Injector]
};


