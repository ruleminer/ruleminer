import { Component, Input, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ValueChangedEvent } from 'devextreme/ui/check_box';

import { isNotCausedByUserEvent } from '../../../../common/utils/devExtremeEventsUtils';
import { SelectedColumnsUploadService } from '../../selected-columns-upload.service';

@Component({
  selector: 'rolap-data-grid-upload-header',
  template: `
    <dx-check-box
      stylingMode="outlined"
      [value]="isSelected()"
      (onValueChanged)="onCheckboxValueChange($event)"></dx-check-box>
    <span class="ml1">{{ dataFieldSignal() | commaToDot }}</span>
  `,
})
export class DataGridUploadHeaderComponent {
  // TODO: When upgrading to Angular 17, replace WritableSignal with the new `input` API for cleaner signal-based inputs. Example:
  // public dataField = input<string>("", { alias: "dataField" });
  public dataFieldSignal: WritableSignal<string> = signal('');
  @Input() set dataField(dataField: string) {
    this.dataFieldSignal.set(dataField);
  }

  private selectedColumnsUploadService = inject(SelectedColumnsUploadService);

  private selectedColumnsSignal = toSignal(this.selectedColumnsUploadService.selectedColumns$, { requireSync: true });

  public isSelected = computed(() => this.selectedColumnsSignal().includes(this.dataFieldSignal()));

  public onCheckboxValueChange(event: ValueChangedEvent): void {
    if (isNotCausedByUserEvent(event)) return;
    this.selectedColumnsUploadService.toggleColumn(this.dataFieldSignal());
  }
}
