import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

import { Label, LabelPost } from '../../interfaces/label.model';

@Injectable({
  providedIn: 'root',
})
export class LabelService {
  private url = `${environment.apiUrl}/labels`;

  constructor(private http: HttpClient) {}

  public getLabels(): Observable<Label[]> {
    return this.http.get<Label[]>(this.url);
  }

  public removeLabel(labelId: number) {
    return this.http.delete(`${this.url}/${labelId}`);
  }

  public addLabel(label: LabelPost) {
    return this.http.post<Label>(this.url, label);
  }

  public editLabel(labelId: number, label: LabelPost) {
    return this.http.patch<Label>(`${this.url}/${labelId}`, label);
  }
}
