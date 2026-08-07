import { Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

import { ConditionCoverageRequest } from 'projects/rolap/src/app/main/project/models/ruleset';
import { ProjectService } from 'projects/rolap/src/app/main/project/service/project.service';

import { KaplanMeierEstimator } from '../../../../../columns/cells/survival-rule-estimator-curve/survival-rule-estimator-curve.component';

@Injectable({
  providedIn: 'root',
})
export class DefaultKaplanMeierEstimatorService {
  constructor(private projectService: ProjectService) {}

  public getDefaultEstimator(datasetId: number): Observable<KaplanMeierEstimator> {
    const payload: ConditionCoverageRequest = {
      meta: {
        attributes: [],
      },
      conditions: [[]],
    };
    return this.projectService
      .getConditionsCoverage(datasetId, payload)
      .pipe(map((res) => res[0].kaplan_meier_estimator));
  }
}
