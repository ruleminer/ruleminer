import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DxSelectBoxModule } from 'devextreme-angular';
import { FilterField } from '../../../filter-builder.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'rolap-field-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    TranslateModule
  ],
  templateUrl: './field-selector.component.html',
  styleUrls: ['./field-selector.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FieldSelectorComponent implements OnInit {
  @Input({ required: true }) availableFields: FilterField[] = [];
  @Input({ required: true }) fieldControl!: FormControl;
  @Output() fieldChange = new EventEmitter<string>();
  private destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    this.fieldControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.fieldChange.emit(value);
    });
  }

}