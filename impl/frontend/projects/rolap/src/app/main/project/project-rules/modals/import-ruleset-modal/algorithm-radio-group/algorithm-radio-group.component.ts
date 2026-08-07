import { Component, Input, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { Observable } from 'rxjs';
import { combineLatestWith, map, startWith, switchMap } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { activeProjectSelector } from '../../../../../../common/store/project/project.selectors';
import { DatasetService } from '../../../../dataset/service/dataset.service';

interface AlgorithmRadioGroup {
  name: string;
  description: string;
}

@Component({
  selector: 'rolap-algorithm-radio-group',
  templateUrl: './algorithm-radio-group.component.html',
  styleUrls: ['./algorithm-radio-group.component.scss'],
})
export class AlgorithmRadioGroupComponent {
  @Input() control: AbstractControl;

  private store = inject(Store<AppState>);
  private datasetService = inject(DatasetService);
  private translateService = inject(TranslateService);

  public algorithms$: Observable<AlgorithmRadioGroup[]> = this.translateService.onLangChange.pipe(
    map((event) => event.lang),
    startWith(this.translateService.currentLang),
    combineLatestWith(
      this.store.select(activeProjectSelector).pipe(
        filterOutNullish(),
        switchMap((activeProject) =>
          this.datasetService
            .getImportRulesetAlgorithms(activeProject.id)
            .pipe(map((algorithms) => ({ activeProject, algorithms }))),
        ),
      ),
    ),
    map(([lang, { activeProject, algorithms }]) =>
      algorithms
        .filter((algorithm) => algorithm.supported_problem_types?.includes(activeProject.type_of_problem))
        .map((algorithm) => ({
          name: algorithm.name,
          description: lang === 'pl' ? algorithm.description_pl : algorithm.description_en,
        })),
    ),
  );
}
