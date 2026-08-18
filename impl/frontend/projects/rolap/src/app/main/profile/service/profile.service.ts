import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { UserPlan } from '../models/profile.models';

export type UserLanguage = {
  preferred_language: string;
};

export interface SubscriptionPlan {
  name: string;
  payment_link: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(private http: HttpClient) {}

  public getUserInfo(): Observable<UserPlan> {
    return this.http.get<UserPlan>(`${environment.apiUrl}/user_info`);
  }

  public getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${environment.apiUrl}/subscription_plans`);
  }

  public getUserLanguage(): Observable<UserLanguage> {
    return this.http.get<UserLanguage>(`${environment.apiUrl}/user_language`);
  }

  public setUserLanguage(lang: string): Observable<UserLanguage> {
    const body = { preferred_language: lang };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<UserLanguage>(`${environment.apiUrl}/user_language`, body, { headers });
  }
}
