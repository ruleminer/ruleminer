import { DxDataGridComponent } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { camelCase, map, mapKeys, uniqBy } from 'lodash';

export const defaultDevExtremePageSizes = [5, 10, 20, 50];

export const createArrayDataSource = (data: any) => {
  return new DataSource({
    reshapeOnPush: true,
    store: new ArrayStore(data),
    paginate: true,
  });
};

export const mapTableObjectToArray = (
  object: Record<string, string | number>,
  keyA = 'name',
  keyB = 'value',
): any[] => {
  return Object.keys({ ...object }).map((key) => {
    const translatedKey = key;
    const translatedValue = object[key];

    return {
      [keyA]: translatedKey,
      [keyB]: translatedValue,
    };
  });
};

export const mapObjectToArray = (
  object: Record<string, string | number>,
  translationData: Map<string, string>,
  keyA = 'name',
  keyB = 'value',
): any[] => {
  return Object.keys(object).map((key) => {
    const translatedKey = translateFromMap(translationData, key);
    const translatedValue = translationData.get(object[key] as string) || object[key];

    return {
      [translateFromMap(translationData, keyA)]: translatedKey,
      [translateFromMap(translationData, keyB)]: translatedValue,
    };
  });
};

export const translateFromMap = (translationData: Map<string, string>, key: string): string =>
  translationData.get(key) || key;

export function dispatchTableState(
  event: any,
  dataGridInstance: DxDataGridComponent['instance'],
  v2TabId: string,
  dispatchFunction: (data: any) => any,
) {
  switch (event.name) {
    case 'paging':
      const pagingState = dataGridInstance.state();
      if (event.fullName.split('.')[1] === 'pageIndex') {
        pagingState.pageIndex = event.value;
      }
      if (event.fullName.split('.')[1] === 'pageSize') {
        pagingState.pageSize = event.value;
      }
      const dispatchPageData = { v2TabId, state: pagingState };
      dispatchFunction(dispatchPageData);
      break;

    case 'columns':
      const eventSubType = event.fullName.split('.')[1];
      if (eventSubType === 'visible') break;
      const columnsState = dataGridInstance.state();
      const indexFromEvent = parseInt(event.fullName.match(/\d+/g), 10);
      for (let i = 0; i < columnsState.columns.length; i++) {
        if (columnsState.columns[i].visibleIndex === indexFromEvent) {
          columnsState.columns[i].sortOrder = event.value;
        } else {
          columnsState.columns[i].sortOrder = null;
        }
      }
      const dispatchColumnsData = { v2TabId, state: columnsState };
      dispatchFunction(dispatchColumnsData);
      break;
  }
}

export function mapImportance(object: any): any[] {
  const outputArray: any[] = [];
  const keys = Object.keys(object);

  const maxSubKeyLength = Math.max(...keys.map((key) => Object.keys(object[key]).length));

  for (let i = 0; i < maxSubKeyLength; i++) {
    const combinedObj: any = {};

    keys.forEach((currentKey) => {
      const subKeys = Object.keys(object[currentKey]);

      if (subKeys[i]) {
        // replace dots with commas DevExtreme doesn't support dots in column names
        const newKey = currentKey.replace(/\./g, ',');
        const valueKey = newKey + '_value';

        combinedObj[newKey] = subKeys[i];
        combinedObj[valueKey] = object[currentKey][subKeys[i]];
      }
    });

    if (Object.keys(combinedObj).length > 0) {
      outputArray.push(combinedObj);
    }
  }

  return outputArray;
}

export function updateObjectKeysDotToComma(objectsArray: any[]) {
  return map(objectsArray, (item) => mapKeys(item, (value, key) => key.replace('.', ',')));
}

export function updateObjectAndRemoveEmptyColumn(objectsArray: any[]) {
  return objectsArray.map((item) => {
    const cleanItem: { [x: string]: any } = {};
    Object.keys(item).forEach((key) => {
      if (key.trim() !== '') {
        const newKey = key.replace('.', ',');
        cleanItem[newKey] = item[key];
      }
    });
    return cleanItem;
  });
}

export function mapBackendColumnNameToTranslateValue(colName: string) {
  if (colName.length > 1) return camelCase(colName.replaceAll('+', 'Plus').replaceAll('-', 'Minus'));
  if (isUpperCase(colName)) return colName.toLowerCase() + 'UpperCase';
  return camelCase(colName);
}

export function isUpperCase(str: string) {
  return str !== str.toLowerCase();
}

// Prepare the state for the DevExtreme table component.
// Fixes devextrme bug with duplicated columns http://js.devexpress.com/error/23_1/E1059
// Using lodash to remove duplicate columns based on dataField
export function prepareDevExtremeTableState(obj: any): any {
  obj.columns = uniqBy(obj.columns, 'dataField');
  return obj;
}
