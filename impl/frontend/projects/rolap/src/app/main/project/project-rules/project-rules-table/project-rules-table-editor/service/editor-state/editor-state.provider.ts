import { InjectionToken, Injector, Provider } from '@angular/core';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../common/store/app-state.model';
import { EditorStateServiceFactory } from './editor-state-service.factory';
import { BaseEditorStateService } from './editor-state.service';
import { activeProjectProblemTypeSelector } from '../../../../../../../common/store/project/project.selectors';

export const EDITOR_STATE_SERVICE_TOKEN = new InjectionToken<BaseEditorStateService>('BaseEditorStateService');

export const editorStateServiceProvider: Provider = {
  provide: EDITOR_STATE_SERVICE_TOKEN,
  useFactory: (injector: Injector, store: Store<AppState>): BaseEditorStateService => {
    const problemTypeSignal = store.selectSignal(activeProjectProblemTypeSelector);
    const problemType = problemTypeSignal();

    if (!problemType) {
      console.warn('Problem type not available...');
      return null! as BaseEditorStateService;
    }

    const factory = injector.get(EditorStateServiceFactory);
    return factory.createService(problemType);
  },
  deps: [Injector, Store],
};
