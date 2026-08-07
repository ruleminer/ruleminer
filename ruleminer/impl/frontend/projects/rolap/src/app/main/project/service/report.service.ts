import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private http: HttpClient) {}

  public getReportFrameSrcDoc(reportId: number): Observable<string> {
    return this.http.get<string>(`${environment.apiUrl}/reports/${reportId}`, { responseType: 'text' as 'json' });
  }

  public renameReport(reportId: number, title: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/reports/${reportId}/modify`, { title });
  }

  public deleteReport(reportId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reports/${reportId}/meta`);
  }
}
