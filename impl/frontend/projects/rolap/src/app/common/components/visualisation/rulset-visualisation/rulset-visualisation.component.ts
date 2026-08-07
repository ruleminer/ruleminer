import { Component } from '@angular/core';

import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

@Component({
  selector: 'rolap-rulset-visualisation',
  templateUrl: './rulset-visualisation.component.html',
  styleUrls: ['./rulset-visualisation.component.scss'],
})
export class RulsetVisualisationComponent {
  public readonly Survival: string = ProblemTypes.Survival.toString();
  public isConditionNotCovered: boolean = false;
  public data: any[] = [];

  public onDataChange(data: any[]) {
    this.data = data;
  }
}
