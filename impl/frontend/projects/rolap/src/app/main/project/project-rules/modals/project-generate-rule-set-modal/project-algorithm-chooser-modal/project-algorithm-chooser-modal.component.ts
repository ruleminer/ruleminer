import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { Algorithm } from '../../../../models/project';

@Component({
  selector: 'rolap-project-algorithm-chooser-modal',
  templateUrl: './project-algorithm-chooser-modal.component.html',
  styleUrls: ['./project-algorithm-chooser-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectAlgorithmChooserModalComponent implements OnChanges {
  @Input() algorithms: Algorithm[] = [];
  @Output() selectedChange = new EventEmitter<Algorithm>();
  public isSelect: Algorithm;

  ngOnChanges(): void {
    if (this.algorithms?.length > 0) {
      this.selectItem(this.algorithms[0]);
    }
  }

  public selectItem(algorithm: Algorithm): void {
    this.selectedChange.emit(algorithm);

    this.isSelect = algorithm;
  }
}
