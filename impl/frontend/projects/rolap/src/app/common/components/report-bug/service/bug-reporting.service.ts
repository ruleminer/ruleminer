import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { nanoid } from 'nanoid';
import { environment } from 'projects/rolap/src/environments/environment';

import { BugReport, BugReportResponse } from './types';

@Injectable({
  providedIn: 'root',
})
export class BugReportingService {
  constructor(private http: HttpClient) {}

  public reportBug(bugReport: BugReport): Observable<BugReportResponse> {
    const formData = new FormData();
    Object.entries(bugReport)
      .filter(([key, value]) => key !== 'screenshot')
      .forEach(([key, value]) => {
        formData.append(key, value);
      });
    if (bugReport.screenshot) {
      const screenshotBlob: Blob = this.base64toBlob(bugReport.screenshot);
      formData.append('screenshot', screenshotBlob, `${nanoid()}.png`);
    }
    return this.http.post<BugReportResponse>(`${environment.bugsReportingApiUrl}/reports`, formData);
  }

  private base64toBlob(base64String: string): Blob {
    const splitDataURI = base64String.split(',');
    const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

    return new Blob([ia], { type: mimeString });
  }
}
