import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

export interface ElementaryNumericalCondition {
  left: number;
  type: 'elementary_numerical';
  right: number | null;
  negated: boolean;
  attributes: number[];
  left_closed: boolean;
  right_closed: boolean;
}

export interface ElementaryNominalCondition {
  type: 'elementary_nominal';
  value: string;
  negated: boolean;
  attributes: number[];
}

export interface CompoundCondition {
  type: 'compound';
  negated: boolean;
  operator: 'CONJUNCTION' | 'DISJUNCTION';
  attributes: number[];
  subconditions: Array<ElementaryNumericalCondition | ElementaryNominalCondition | CompoundCondition>;
}

export interface Conclusion {
  value: number;
  estimator: any | null;
  median_survival_time_ci_lower: number;
  median_survival_time_ci_upper: number;
}

export interface RuleContext {
  uuid: string;
  string: string;
  premise: ElementaryNumericalCondition | ElementaryNominalCondition | CompoundCondition;
  coverage: any | null;
  conclusion: Conclusion;
  voting_weight: any | null;
}

export interface Comment {
  code: string;
  context: RuleContext[];
}

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private httpClient = inject(HttpClient);

  public getComments(datasetId: number, rulesetId: number): Observable<Comment[]> {
    return this.httpClient.get<Comment[]>(`${environment.apiUrl}/datasets/${datasetId}/rulesets/${rulesetId}/comments`);
  }

  public updateComment(datasetId: number, rulesetId: number, comment: any): Observable<any> {
    return this.httpClient.patch<any>(
      `${environment.apiUrl}/datasets/${datasetId}/rulesets/${rulesetId}/comments`,
      comment,
    );
  }
}
