import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'projects/rolap/src/environments/environment';

import { BarPlotElement, CorrelationMatrix, HistogramElement } from '../../models/project';

@Injectable({
  providedIn: 'root',
})
export class DatasetChartsService {
  constructor(private http: HttpClient) {}

  public getCorrelationMatrix(dataSetId: number): Observable<CorrelationMatrix> {
    return this.http.get<CorrelationMatrix>(`${environment.apiUrl}/datasets/${dataSetId}/correlation_matrix`);
  }

  public getHistogramData(
    dataSetId: number,
    bins: number | null,
    attributes: string[] | null = null,
  ): Observable<HistogramElement[]> {
    let params = new HttpParams();
    if (bins) params = params.append('bins', bins);
    if (attributes) params = params.append('attributes', attributes.join(','));
    return this.http.get<HistogramElement[]>(`${environment.apiUrl}/datasets/${dataSetId}/histogram`, {
      params: params,
    });
  }

  public getCountPlot(dataSetId: number): Observable<BarPlotElement[]> {
    return this.http.get<BarPlotElement[]>(`${environment.apiUrl}/datasets/${dataSetId}/count_plot`);
  }
}
