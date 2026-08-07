import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { CardModule } from '../../../../common/components/card/card.module';
import { RulesetPredictionConfigurationComponent } from '../../project-description/ruleset-prediction-configuration/ruleset-prediction-configuration.component';
import {
  DisplayType,
  RulesetPredictionConfigurationComponentData,
} from '../../project-description/ruleset-prediction-configuration/types';

@Component({
  selector: 'rolap-predition-settings-card',
  templateUrl: './predition-settings-card.component.html',
  styleUrls: ['./predition-settings-card.component.scss'],
  standalone: true,
  imports: [CardModule, TranslateModule, RulesetPredictionConfigurationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreditionSettingsCardComponent {
  public readonly predictionConfigurationData: RulesetPredictionConfigurationComponentData = {
    displayType: DisplayType.RuleSetTab,
  };
}
