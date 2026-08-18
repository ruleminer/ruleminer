import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

interface TourPayload {
  name: 'main_tour';
}

@Injectable({
  providedIn: 'root',
})
export class TourApiService {
  private httpClient = inject(HttpClient);

  public getCompletedTours(): Observable<any> {
    return this.httpClient.get<any>(`${environment.apiUrl}/completed_tours/`);
  }

  public setCompletedTour(): Observable<any> {
    const payload: TourPayload = { name: 'main_tour' };
    return this.httpClient.post<any>(`${environment.apiUrl}/completed_tours/`, payload);
  }

  public removeTour() {
    const tourName = 'main_tour';
    return this.httpClient.delete<any>(`${environment.apiUrl}/completed_tours/${tourName}/`);
  }
}
