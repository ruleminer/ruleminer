import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import {
  DxCheckBoxModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';

import { EDITOR_STATE_SERVICE_TOKEN } from '../../../../../main/project/project-rules/project-rules-table/project-rules-table-editor/service/editor-state/editor-state.provider';
import { FilterDataType, FilterField } from '../../../filter-builder.types';
import { isAttrOperatorFn } from '../../../utils/filter-builder.utils';
import { AttrMinMaxValueInfoComponent } from '../../attr-min-max-value-info/attr-min-max-value-info.component';

interface EditorValidationApi {
  setValueInputsValidationErrors(hasErrors: boolean): void;
}

@Component({
  selector: 'rolap-value-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxCheckBoxModule,
    TranslateModule,
    AttrMinMaxValueInfoComponent,
  ],
  templateUrl: './value-input.component.html',
  styleUrls: ['./value-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ValueInputComponent implements OnInit, OnChanges {
  @Input({ required: true }) effectiveDataType: FilterDataType | undefined;
  @Input({ required: true }) isBetweenOperator: boolean = false;
  @Input({ required: true }) isValueRequired: boolean = true;
  @Input({ required: true }) selectedField: FilterField | undefined;
  @Input({ required: true }) valueControl!: FormControl;
  @Input() valueEndControl: FormControl | undefined;
  @Input() rowIndex: number | null = null;
  @Input() operatorValue: string | undefined;
  @Input() getAvailableAttributesToCompare: ((currentFieldName: string | null) => FilterField[]) | undefined;
  public isAttrOperator: boolean = false;

  private editorStateService = inject(EDITOR_STATE_SERVICE_TOKEN) as unknown as EditorValidationApi;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.setupBetweenControls();
    this.setupValidationReporting();
    this.updateValidationReporting();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.isAttrOperator = isAttrOperatorFn(this.operatorValue);
    if (changes['isBetweenOperator']) {
      this.setupBetweenControls();
    }
    // Re-evaluate validation state when inputs change
    this.updateValidationReporting();
  }

  private setupBetweenControls() {
    if (this.valueControl) {
      this.valueControl.updateValueAndValidity();
    }

    if (this.valueEndControl) {
      this.valueEndControl.updateValueAndValidity();
    }
    this.updateValidationReporting();
  }

  private setupValidationReporting(): void {
    if (this.valueControl) {
      this.valueControl.statusChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateValidationReporting());
    }
    if (this.valueEndControl) {
      this.valueEndControl.statusChanges
        ?.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateValidationReporting());
    }
  }

  private updateValidationReporting(): void {
    const startHasError = !!(
      this.valueControl &&
      this.valueControl.enabled &&
      this.valueControl.touched &&
      this.valueControl.invalid
    );
    const endHasError = !!(
      this.valueEndControl &&
      this.valueEndControl.enabled &&
      this.valueEndControl.touched &&
      this.valueEndControl.invalid
    );
    const hasAnyError = startHasError || endHasError;
    this.editorStateService.setValueInputsValidationErrors(hasAnyError);
  }

  public getLookupOptions(): { value: unknown; text: string }[] {
    const isAttrOperator = isAttrOperatorFn(this.operatorValue);

    if (isAttrOperator) {
      // For attribute operators, use the function from the container to get available attributes
      if (this.getAvailableAttributesToCompare && this.selectedField?.dataField) {
        const availableAttributes = this.getAvailableAttributesToCompare(this.selectedField.dataField);
        return availableAttributes.map((field: FilterField) => ({
          value: field.dataField,
          text: field.caption || field.dataField || 'Unknown Field',
        }));
      }

      // Fallback to the static attrDataSource if the function is not available
      if (this.selectedField?.lookup?.attrDataSource && this.selectedField.lookup.attrDataSource.length > 0) {
        return this.selectedField.lookup.attrDataSource.map((item: unknown) => ({
          value: item,
          text:
            typeof item === 'object' && item !== null && 'text' in item
              ? (item as { text: string }).text
              : String(item),
        }));
      }

      // If no attributes are available, return empty array
      return [];
    }

    // For non-attribute operators, check if we have lookup data
    if (!this.selectedField?.lookup) return [];

    const looksBoolean =
      this.effectiveDataType === 'boolean' &&
      this.selectedField.lookup.dataSource.every(
        (v: unknown) => typeof v === 'string' && (v.toLowerCase() === 'true' || v.toLowerCase() === 'false'),
      );

    if (looksBoolean) {
      const trueVal =
        this.selectedField.lookup.dataSource.find((v: unknown) => String(v).toLowerCase() === 'true') || 'True';
      const falseVal =
        this.selectedField.lookup.dataSource.find((v: unknown) => String(v).toLowerCase() === 'false') || 'False';
      return [
        { value: trueVal, text: String(trueVal) },
        { value: falseVal, text: String(falseVal) },
      ];
    }

    return this.selectedField.lookup.dataSource.map((item: unknown) => ({
      value: item,
      text:
        typeof item === 'object' && item !== null && 'text' in item ? (item as { text: string }).text : String(item),
    }));
  }
}
