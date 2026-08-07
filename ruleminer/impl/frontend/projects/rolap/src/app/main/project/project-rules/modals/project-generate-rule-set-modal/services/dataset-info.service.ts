import { Injectable, inject } from '@angular/core';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { Observable, combineLatest, map, of, take } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../common/store/app-state.model';
import { selectDetailsOfRuleSetGenerationEntities } from '../../../../../../common/store/v2DataSetTable/v2DataSetTable.selectors';
import { prepareDevExtremeTableState } from '../../../../../../common/utils/dataGridUtils';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { DatasetService } from '../../../../dataset/service/dataset.service';
import { DatasetInfo } from '../algorithm-configuration/types';

@Injectable({
  providedIn: 'root',
})
export class DatasetInfoService {
  private datasetService = inject(DatasetService);
  private store = inject(Store<AppState>);

  public getDatasetInfo(
    projectId: number,
    dataSetId: number,
    dataSetName: string,
    projectProblemType: ProblemTypes,
  ): Observable<DatasetInfo> {
    const entityId = `${projectId}-${dataSetId}-0-0-dataSet`;

    const classDistribution$ =
      projectProblemType === ProblemTypes.Classification
        ? this.datasetService.getClassDistribution(dataSetId)
        : of(null);

    const attributes$ = this.datasetService.getAttributesForDataset(dataSetId);

    const skippedAttributes$ = this.store.select(selectDetailsOfRuleSetGenerationEntities).pipe(
      map((entities) => entities[entityId]),
      map((entity) => entity?.state),
      map((tableStates) => {
        if (tableStates) return JSON.parse(tableStates);
        return '';
      }),
      filterOutNullish(),
      take(1),
      map((state) => {
        state = prepareDevExtremeTableState({ ...state });
        return state.columns
          .filter((column: { visible: boolean }) => !column.visible)
          .map((column: { dataField: string }) => column.dataField);
      }),
    );
    return combineLatest([attributes$, classDistribution$, skippedAttributes$]).pipe(
      map(([attributes, classDistribution, initialAttributesToSkip]) => {
        return {
          decisionAttributeName: attributes.find((item) => item.role === 'class')!.name,
          datasetAttributes: attributes,
          attributes: attributes.filter((attr) => attr.role === 'attr').map((attr) => attr.name),
          datasetName: dataSetName,
          classDistribution: classDistribution,
          initialAttributesToSkip: initialAttributesToSkip,
        };
      }),
    );
  }
}
