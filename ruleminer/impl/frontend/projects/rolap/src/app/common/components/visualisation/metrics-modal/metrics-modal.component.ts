import { Component, Input, OnInit } from '@angular/core';

import { Modal } from '../../../services/modal/modal';

@Component({
  selector: 'rolap-metrics-modal',
  templateUrl: './metrics-modal.component.html',
  styleUrls: ['./metrics-modal.component.scss'],
})
export class MetricsModalComponent implements OnInit {
  @Input() metrics: { name: string; enabled: boolean }[];
  @Input() maxSelectionCount: number;

  public selectionCount: number = 0;

  constructor(private modal: Modal<MetricsModalComponent>) {}

  ngOnInit(): void {
    this.selectionCount = this.metrics.filter((metric: any) => metric.enabled).length;
  }

  toggleMetric(metric: any, event: MouseEvent): void {
    if (this.metrics.filter((metricItem: any) => metricItem.enabled).length >= this.maxSelectionCount) {
      metric.enabled = false;
      this.selectionCount = this.metrics.filter((metricItem: any) => metricItem.enabled).length;
      return;
    }

    this.metrics = this.metrics.map((metricItem: any) => {
      if (metricItem.name === metric.name) {
        return {
          ...metricItem,
          enabled: !metricItem.enabled,
        };
      }
      return metricItem;
    });

    this.selectionCount = this.metrics.filter((metricItem: any) => metricItem.enabled).length;
  }

  public selectMetrics(): void {
    this.modal.close(this.metrics.filter((metric: any) => metric.enabled));
  }
}
