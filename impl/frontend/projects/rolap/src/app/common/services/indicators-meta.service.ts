import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

import { ProblemTypes } from '../../main/data-upload/utils/enums';
import { IndicatorMeta } from '../store/indicatorsMeta/types';

@Injectable({
  providedIn: 'root',
})
export class IndicatorsMetaService {
  private http = inject(HttpClient);

  public getIndicatorsMetaData(problemType: ProblemTypes): Observable<IndicatorMeta[]> {
    return this.http.get<IndicatorMeta[]>(`${environment.apiUrl}/indicators_meta?type_of_problem=${problemType}`);
  }
}
