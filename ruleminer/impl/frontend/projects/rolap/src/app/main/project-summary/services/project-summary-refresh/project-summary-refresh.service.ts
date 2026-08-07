import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectSummaryRefreshService {
  private refresh = new BehaviorSubject<boolean>(false);

  constructor() {}

  public setRefreshState(value: boolean) {
    this.refresh.next(value);
  }

  public getRefreshState() {
    return this.refresh;
  }
}
