import { Component, inject } from '@angular/core';

import { V2ClassifyCard } from '../../../common/store/v2Classify/types';
import { ClassifyService } from './classify.service';

@Component({
  selector: 'rolap-project-example',
  templateUrl: './project-example.component.html',
  styleUrls: ['./project-example.component.scss'],
})
export class ProjectExampleComponent {
  public cards: V2ClassifyCard[];

  private classifyService = inject(ClassifyService);
  public cardsIds = this.classifyService.cardsIds;
}
