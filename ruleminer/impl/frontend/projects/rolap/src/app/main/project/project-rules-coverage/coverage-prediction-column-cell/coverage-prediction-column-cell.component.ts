import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartLine } from '@fortawesome/pro-regular-svg-icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';
import { RolapModalModule } from 'projects/rolap/src/app/common/modules/modal.module';
import { ModalService } from 'projects/rolap/src/app/common/services/modal/modal.service';

import { ProblemTypes } from '../../../data-upload/utils/enums';
import { SurvivalPredictionItem } from '../../models/ruleset';
import { SurvivalPredictionCurvePlotComponent } from '../../project-rules/survival-prediction-curve-plot/survival-prediction-curve-plot.component';

@Component({
  selector: 'rolap-coverage-prediction-column-cell',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxButtonModule,
    FontAwesomeModule,
    RolapModalModule,
    SurvivalPredictionCurvePlotComponent,
  ],
  templateUrl: './coverage-prediction-column-cell.component.html',
  styleUrls: ['./coverage-prediction-column-cell.component.scss'],
})
export class CoveragePredictionColumnCellComponent {
  @Input() problemType: string;
  @Input() prediction: number | string | SurvivalPredictionItem;
  @Input() exampleIndex: number;
  @Input() colored = false;
  public faChartLine = faChartLine;

  // unfortunately, there is no way to use enum values as problemType is string
  public ProblemTypes = ProblemTypes;

  constructor(private translate: TranslateService, private modalService: ModalService) {}

  public onSeeSurvivalPredictionDetailsClick() {
    this.modalService.open(
      SurvivalPredictionCurvePlotComponent,
      this.translate.instant('project.prediction.details_modal.title', { exampleNumber: this.exampleIndex }),
      'calc(100vw - 4rem)',
      'auto',
      {
        prediction: this.prediction,
      },
    );
  }
}
