import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'projects/rolap/src/environments/environment';
import { ProcessApiResponse } from '../../../main/project/models/project';
import { ProcessDetails } from '../../../main/project/process/models/process.model';
import { MappedItem } from '../../../main/project/dataset/models/treeview';
import { DataGroup } from '../../../main/project/process/project-effect/project-effect.component';

@Injectable({
  providedIn: 'root',
})
export class ProcessService {

  constructor(private http: HttpClient) { }

  public getProcess(id: number): Observable<ProcessDetails> {
    return this.http.get<ProcessDetails>(`${environment.apiUrl}/tasks/${id}`);
  }

  public getProcessList(
    projectId: number,
    status: string | null,
    type: string | null,
    limit: number,
    offset: number,
    sorting?: string | null,
  ): Observable<ProcessApiResponse> {
    let params = new HttpParams();

    if (status) {
      params = params.append('status__in', status);
    }

    if (type) {
      params = params.append('type__in', type);
    }

    if (sorting) {
      params = params.append('ordering', sorting);
    }

    return this.http.get<ProcessApiResponse>(
      `${environment.apiUrl}/tasks/project/${projectId}?limit=${limit}&offset=${offset}`,
      { params },
    );
  }

  public abortTask(taskId: number): Observable<string> {
    return this.http.post<string>(`${environment.apiUrl}/tasks/${taskId}/abort`, {});
  }

  public stopTask(taskId: number): Observable<string> {
    return this.http.post<string>(`${environment.apiUrl}/tasks/${taskId}/stop`, {});
  }

  public getDataSet(projectData: MappedItem, processDetails: ProcessDetails) {
    if (!projectData.items) return;

    const index = projectData.items?.findIndex(
      (x) =>
        x.ids.projectId === processDetails.project && x.ids.dataSetId === processDetails.source_object_id,
    );

    if (index <= -1) return;
    return projectData.items[index];
  }

  /**
   * Get ruleset or report data.
   *
   * @param dataSetData
   * @param type
   */
  public getDataGroup(dataSetData: MappedItem, type: DataGroup) {
    if (!dataSetData.items) return;

    const index = dataSetData.items?.findIndex((x) => x.type === type);

    if (index <= -1) return;
    return { index: index, dataGroup: dataSetData.items[index] };
  }
}
