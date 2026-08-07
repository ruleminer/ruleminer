import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { DxCheckBoxModule } from 'devextreme-angular';
import { ValueChangedEvent } from 'devextreme/ui/check_box';

import { FilteringRule, VisibleRule } from '../../../store/v2RulesCoverageTab/types';

@Component({
  standalone: true,
  imports: [DxCheckBoxModule],
  selector: 'rolap-store-table-check-box',
  templateUrl: './store-table-check-box.component.html',
})
export class StoreTableCheckBoxComponent implements OnChanges {
  @Input() uuid: string;
  @Input() selectedRules: (VisibleRule | FilteringRule)[] | undefined | null;
  @Input() disabled: boolean = false;
  @Output() onValueChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  public isChecked: boolean = false;

  ngOnChanges(): void {
    this.checkSelectedRules();
  }

  private checkSelectedRules(): void {
    if (this.selectedRules === undefined || this.selectedRules === null) {
      this.isChecked = false;
      return;
    }
    this.isChecked = this.selectedRules!.some((patch) => patch.uuid === this.uuid);
  }

  public valueChanged(event: ValueChangedEvent): void {
    this.isChecked = event.value;
    this.onValueChange.emit(event.value);
  }
}
