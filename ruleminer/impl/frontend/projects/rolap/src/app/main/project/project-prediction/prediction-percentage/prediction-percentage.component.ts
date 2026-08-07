import { Component, Input } from '@angular/core';

@Component({
  selector: 'rolap-prediction-percentage',
  templateUrl: './prediction-percentage.component.html',
  styleUrls: ['./prediction-percentage.component.scss'],
})
export class PredictionPercentageComponent {
  @Input() predictionPercentage!: number | null;

  get formattedPercentage(): string {
    if (this.predictionPercentage === null) return '';
    return Number(this.predictionPercentage.toFixed(2)).toString();
  }
}
