import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

import { UserLimits } from './models/account.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private http: HttpClient) {}

  public getUserLimits(): Observable<UserLimits> {
    return this.http.get<UserLimits>(`${environment.apiUrl}/user_limits`);
  }
}
