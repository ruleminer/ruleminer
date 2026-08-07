import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  constructor(private http: HttpClient) {}

  public getSystemVersion(): Observable<string> {
    return this.http.get<{ version: string }>(`${environment.apiUrl}/version`).pipe(map((res) => res.version));
  }
}
