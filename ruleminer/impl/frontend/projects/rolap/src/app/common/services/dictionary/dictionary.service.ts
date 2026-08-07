import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

import { VotingMeasure } from '../../interfaces/dictionary.model';

@Injectable({
  providedIn: 'root',
})
export class DictionaryService {
  constructor(private http: HttpClient) {}

  public getVotingMeasure(): Observable<VotingMeasure[]> {
    return this.http.get<VotingMeasure[]>(`${environment.apiUrl}/voting_measures`);
  }
}
