import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DxSelectBoxModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { OperatorDefinition } from '../../../filter-builder.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filterOutNullish } from '../../../../utils/rxjsUtils';

@Component({
  selector: 'rolap-operator-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    TranslateModule,
  ],
  templateUrl: './operator-selector.component.html',
  styleUrls: ['./operator-selector.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OperatorSelectorComponent implements OnInit {
  @Input({ required: true }) availableOperators: OperatorDefinition[] = [];
  @Input({ required: true }) operatorControl!: FormControl;
  @Output() operatorChange = new EventEmitter<string>();
  private destroyRef = inject(DestroyRef);


  public ngOnInit(): void {
    this.operatorControl.valueChanges.pipe(
      filterOutNullish(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.operatorChange.emit(value);
    });
  }


}