import { Injectable, Injector } from '@angular/core';

import { ProblemTypes } from '../../../../../../data-upload/utils/enums';
import { BaseEditorStateService } from './editor-state.service';
import { ClassificationEditorStateService } from './project-types/classification-editor-state.service';
import { RegressionEditorStateService } from './project-types/regression-editor-state.service';
import { SurvivalEditorStateService } from './project-types/survival-editor-state.service';

@Injectable({
  providedIn: 'root',
})
export class EditorStateServiceFactory {
  constructor(private injector: Injector) {}

  createService(problemType: ProblemTypes): BaseEditorStateService {
    switch (problemType) {
      case ProblemTypes.Classification:
        return this.injector.get(ClassificationEditorStateService);
      case ProblemTypes.Regression:
        return this.injector.get(RegressionEditorStateService);
      case ProblemTypes.Survival:
        return this.injector.get(SurvivalEditorStateService);
      default:
        throw new Error(`Unsupported problem type: ${problemType}`);
    }
  }
}
