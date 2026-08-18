import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';

import { Store } from '@ngrx/store';

import { AppState } from '../../../common/store/app-state.model';
import { selectCurrentAttributes } from '../../../common/store/attributes/attributes.selectors';
import {
  selectClassifyCardsForColumns,
  selectClassifyCardsIds,
} from '../../../common/store/v2Classify/v2Classify.selectors';
import { selectCurrentV2TabIds } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { DatasetService } from '../dataset/service/dataset.service';
import { NominalAttributes } from '../project-rules/project-rules-table/project-rules-table-editor/types/rules-editor';

@Injectable({
  providedIn: 'root',
})
export class ClassifyService {
  private datasetService = inject(DatasetService);
  private store = inject(Store<AppState>);
  private nominalAttributes = signal<NominalAttributes<string> | null>(null);
  private ids = toSignal(this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish()));
  private destroyRef = inject(DestroyRef);

  public cardsIds = toSignal(this.store.select(selectClassifyCardsIds).pipe(filterOutNullish()));
  public attributes = toSignal(this.store.select(selectCurrentAttributes).pipe(filterOutNullish()));
  public classifyCardsForColumns = toSignal(this.store.select(selectClassifyCardsForColumns).pipe(filterOutNullish()));
  public columnsTypes: Map<string, string> = new Map();

  constructor() {
    effect(() => {
      const ids = this.ids();
      if (!ids || !ids.dataSetId) return;

      this.datasetService
        .getNominalAttributes(ids.dataSetId)
        .pipe(filterOutNullish(), takeUntilDestroyed(this.destroyRef))
        .subscribe((data) => {
          this.nominalAttributes.set(data);
        });
    });
  }

  public columns = computed(() => {
    const nominalAttributesWithValues = this.nominalAttributes();
    const columnsObj = this.classifyCardsForColumns();

    if (!nominalAttributesWithValues || !columnsObj) return [];

    const colNames = columnsObj[0];
    const columns: any[] = [];

    for (const key in colNames) {
      if (key !== this.datasetService.ID_COLUMN_DISPLAY_NAME) {
        const backendDataType = this.columnsTypes.get(key) || 'cat';
        const dataType = this.datasetService.mapBackendTypeToDevExtremeColumnType(backendDataType);

        if (nominalAttributesWithValues.hasOwnProperty(key)) {
          const columnsNominalAttributes = nominalAttributesWithValues[key]
            ? [...nominalAttributesWithValues[key]]
            : [];
          const listOfValues = ['', ...columnsNominalAttributes];
          const lookup = listOfValues.map((item) => ({ name: item }));

          columns.push({
            name: key,
            lookup,
            dataType,
          });
        } else {
          columns.push({
            name: key,
            dataType,
          });
        }
      }
    }
    columns.unshift({
      name: this.datasetService.ID_COLUMN_DISPLAY_NAME,
      dataType: 'string',
      allowEditing: false,
      cssClass: 'bold fixed-height-row',
    });

    columns.forEach((column) => {
      if (column.name === this.labelAttribute() || column.name === 'survival_time') {
        column.visible = false;
      } else {
        column.visible = true;
      }
    });

    return columns;
  });

  public labelAttribute = computed(() => {
    const attributes = this.attributes();
    if (!attributes) return null;

    this.columnsTypes.clear();
    attributes.forEach((attr) => {
      this.columnsTypes.set(attr.name, attr.type);
    });
    const labelAttr = attributes.find((attr) => attr.role === 'class')?.name;

    if (!labelAttr) return null;

    return labelAttr;
  });
}
