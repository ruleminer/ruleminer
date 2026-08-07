import { Component, inject } from '@angular/core';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { map } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../common/store/project/project.selectors';

@Component({
  selector: 'rolap-process',
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.scss'],
})
export class ProcessComponent {
  private store = inject(Store<AppState>);
  public projectId$ = this.store.select(activeProjectSelector).pipe(
    filterOutNullish(),
    map((project) => project?.id),
  );
}
