import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../../../common/utils/rxjsUtils';

import { Store } from '@ngrx/store';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { AppState } from '../../../../../../../common/store/app-state.model';
import { activeProjectProblemTypeSelector } from '../../../../../../../common/store/project/project.selectors';

export interface BaseRule {
  uuid: string;
  string: string;
  premise: any;
  conclusion: BaseConclusion;
}

export interface BaseConclusion {
  value: any | undefined;
}

@Component({
  selector: 'rolap-rule-conclusion-editor',
  templateUrl: './rule-conclusion-editor.component.html',
  styleUrls: ['./rule-conclusion-editor.component.scss'],
})
export class RuleConclusionEditorComponent {
  private store = inject(Store<AppState>);

  public readonly ProblemTypes = ProblemTypes;
  public problemTypeSignal = toSignal(this.store.select(activeProjectProblemTypeSelector).pipe(filterOutNullish()));
}
