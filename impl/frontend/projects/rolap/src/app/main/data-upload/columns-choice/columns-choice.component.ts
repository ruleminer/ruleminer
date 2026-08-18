import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject, Subscription, map, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { DxiDataGridColumn } from 'devextreme-angular/ui/nested/base/data-grid-column-dxi';
import dxDataGrid from 'devextreme/ui/data_grid';

import { ProjectService } from '../../project/service/project.service';
import { ProblemTypes } from '../utils/enums';
import { ColumnsTypesDeduceService, ColumnsTypesDeducingResult } from './columns-types-deduce.service';

export interface LabelChoiceResult {
  labelColumnIndex: number;
  survivalTimeColumnIndex?: number;
}

export interface ColumnMetadata {
  type: string;
  selected: boolean;
}

const isClassification = (problemType: ProblemTypes) => {
  return problemType === ProblemTypes.Classification;
};

const isRegression = (problemType: ProblemTypes) => {
  return problemType === ProblemTypes.Regression;
};

const isSurvival = (problemType: ProblemTypes) => {
  return problemType === ProblemTypes.Survival;
};

@Component({
  selector: 'rolap-columns-choice',
  templateUrl: './columns-choice.component.html',
  styleUrls: ['./columns-choice.component.scss'],
})
export class ColumnsChoiceComponent implements OnChanges, OnDestroy {
  @Input() problemType: ProblemTypes;
  @Input() dataSource: any[];
  @Output() formDataEmitter = new EventEmitter<any>();
  public external: string;
  public dataSourceWithDropdowns: any[];
  public form: FormGroup = this.fb.group({});
  public decisionColumnItems: string[] = [];
  public survivalTimeColumnItems: string[] = [];
  public columnTypes: string[];
  public columnTypesSelected: any = {};
  public typesDeduced = false;

  public columnsWidths: number[];
  public decisionColumnLabel = '';
  public tooltip = '';
  private ngUnsubscribe: Subject<void> = new Subject();
  private valueChangesSub: Subscription;

  constructor(
    private projectService: ProjectService,
    private columnTypesDeduceService: ColumnsTypesDeduceService,
    private fb: FormBuilder,
    private translateService: TranslateService,
  ) {
    this.projectService
      .getTypes()
      .pipe(
        map((data) => data.types),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((columnTypes: string[]) => {
        this.columnTypes = columnTypes;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['problemType']) {
      this.setDecisionColumnLabel();
      this.setTooltipByProblemType();
    }
    if (changes['problemType'] || changes['dataSource']) {
      //FIRST ROW IS DROPDOWN ROW
      const objectKeys = Object.keys(this.dataSource[0]);
      const firstRow = objectKeys.reduce((acc: any, key: string) => {
        acc[key] = key.charAt(0).toUpperCase() + key.slice(1); //capitalize first letter
        return acc;
      }, {});
      this.dataSourceWithDropdowns = [firstRow, ...this.dataSource];
      this.deduceColumnsTypes();
      this.setDecisionColumnItems();
      this.setSurvivalTimeColumnItems();

      const decisionColumn: string | null = this.columnTypesDeduceService.checkIfColumnContainsValue(
        this.decisionColumnItems,
        this.problemType,
      );
      this.form = this.fb.group({
        decisionColumn: [decisionColumn, [Validators.required]],
      });
      if (isSurvival(this.problemType)) {
        const survivalTimeColumn: string | null = this.columnTypesDeduceService.checkIfColumnContainsSurvivalValue(
          this.survivalTimeColumnItems,
        );
        this.form.addControl('survivalTimeColumn', this.fb.control(survivalTimeColumn, [Validators.required]));
        this.form.updateValueAndValidity();
      }

      this.valueChangesSub?.unsubscribe();

      this.valueChangesSub = this.form.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
        this.emitFormDataEmitter();
      });

      this.form.controls['decisionColumn'].valueChanges.subscribe(() => {
        this.emitFormDataEmitter();
      });

      this.emitFormDataEmitter();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private emitFormDataEmitter(): void {
    const decisionColumnFormValue = this.form.get('decisionColumn')?.value;
    const decisionColumnTypeValue = this.columnTypesSelected[decisionColumnFormValue];

    const shouldSetDecisionColumnToNull =
      (isClassification(this.problemType) && decisionColumnTypeValue !== 'cat') ||
      (isRegression(this.problemType) && decisionColumnTypeValue !== 'num');

    if (shouldSetDecisionColumnToNull) {
      this.form.get('decisionColumn')?.setValue(null, { emitEvent: false });
    }

    const survivalTimeColumn = isSurvival(this.problemType) ? this.form.get('survivalTimeColumn')?.value : null;

    const data = {
      columnTypesSelected: this.columnTypesSelected,
      decisionColumn: this.form.get('decisionColumn')?.value,
      survivalTimeColumn,
      isValid: this.form.valid,
    };
    this.formDataEmitter.emit(data);
  }

  public customizeColumns(columns: DxiDataGridColumn[]): void {
    columns.forEach(
      (column) => (
        (column.allowSorting = false),
        (column.allowFiltering = false),
        (column.allowReordering = false),
        (column.headerCellTemplate = 'columnDropdownTemplate')
      ),
    );
  }
  public selectBoxChange(event: any, info: any): void {
    const selectedValue = event.itemData;
    const columnKey = info.column.dataField;

    this.columnTypesSelected[columnKey] = selectedValue;

    const decisionColumnFormValue = this.form.get('decisionColumn')?.value;
    const survivalTimeColumnFormValue = this.form.get('survivalTimeColumn')?.value;
    const decisionColumnTypeValue = this.columnTypesSelected[decisionColumnFormValue];

    if (decisionColumnFormValue === columnKey) {
      if (
        (this.problemType === ProblemTypes.Classification && selectedValue === 'cat') ||
        (this.problemType === ProblemTypes.Regression && selectedValue !== 'num') ||
        (this.problemType === ProblemTypes.Survival && selectedValue === 'num')
      ) {
        this.form.get('decisionColumn')?.setValue(null);
      }
    }

    if (survivalTimeColumnFormValue === columnKey && this.problemType === ProblemTypes.Survival) {
      if (selectedValue !== 'num') {
        this.form.get('survivalTimeColumn')?.setValue(null);
      }
    }

    this.setDecisionColumnItems();
    this.setSurvivalTimeColumnItems();

    if (this.problemType === ProblemTypes.Classification && decisionColumnTypeValue !== 'cat') {
      this.form.get('decisionColumn')?.patchValue(null);
    }
    if (this.problemType === ProblemTypes.Regression && decisionColumnTypeValue !== 'num') {
      this.form.get('decisionColumn')?.patchValue(null);
    }
    this.form.updateValueAndValidity();

    this.emitFormDataEmitter();
  }

  private setDecisionColumnItems(): void {
    const requiredType =
      isClassification(this.problemType) || isSurvival(this.problemType)
        ? 'cat'
        : isRegression(this.problemType)
        ? 'num'
        : null;

    if (!requiredType) return;

    this.decisionColumnItems = Object.keys(this.columnTypesSelected).filter(
      (key) => this.columnTypesSelected[key] === requiredType,
    );

    if (this.decisionColumnItems.length === 0) {
      this.form?.controls['decisionColumn']?.patchValue(null, { emitEvent: false });
    }
  }

  private setSurvivalTimeColumnItems(): void {
    if (!isSurvival(this.problemType)) {
      this.survivalTimeColumnItems = [];
      return;
    }

    this.survivalTimeColumnItems = Object.keys(this.columnTypesSelected).filter(
      (key) => this.columnTypesSelected[key] === 'num',
    );

    if (this.survivalTimeColumnItems.length === 0) {
      this.form.controls['survivalTimeColumn'].patchValue(null, { emitEvent: false });
    }
  }

  public onTableContentReady(dxDataGridInstance: dxDataGrid): void {
    this.columnsWidths = dxDataGridInstance.getVisibleColumns().map((column: any) => column.visibleWidth);
  }

  public onSelectBoxInitialized(e: any, info: any): void {
    const v = e.component.option('value');
    if (v !== null) return;
    e.component.option('value', this.columnTypesSelected[info.column.dataField]);
  }

  private deduceColumnsTypes(): void {
    const results: ColumnsTypesDeducingResult | null = this.columnTypesDeduceService.deduceColumnsTypes(
      this.dataSource,
      this.problemType,
    );

    this.columnTypesSelected = results?.columnsTypes || {};
  }

  private setDecisionColumnLabel(): void {
    if (isClassification(this.problemType) || isRegression(this.problemType)) {
      this.decisionColumnLabel = 'data_upload.class';
      return;
    }
    if (isSurvival(this.problemType)) {
      this.decisionColumnLabel = 'data_upload.survival_status';
      return;
    }
  }

  private setTooltipByProblemType(): void {
    if (isClassification(this.problemType)) this.tooltip = 'data_upload.tooltips.classification_tooltip';
    if (isRegression(this.problemType)) this.tooltip = 'data_upload.tooltips.regression_tooltip';
    if (isSurvival(this.problemType)) this.tooltip = 'data_upload.tooltips.survival_status_tooltip';
  }
}
