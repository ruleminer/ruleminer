import type { InitializedEvent, ValueChangedEvent } from 'devextreme/ui/check_box';
import dxCheckBox from 'devextreme/ui/check_box';
import dxDataGrid, { EditorPreparingEvent, SelectionChangedEvent } from 'devextreme/ui/data_grid';

/**
 * Helper service for handling  rules table row selection.
 * It allows to disable selection for some rows.
 *
 * Code is mostly copied from https://supportcenter.devexpress.com/ticket/details/t869704/datagrid-for-devextreme-how-to-disable-selecting-certain-rows#Angular/src/app/app.component.ts
 * but heavily refactored for better readability.
 *
 * To use it just create an instance of this class and bind its methods:
 * * onSelectionChanged
 * * onEditorPreparing
 *
 * to dxDataGrid component instance in the template
 */
export class RulesTableSelectionService {
  private selectAllCheckBox: dxCheckBox;
  private selectAllCheckBoxUpdating = false;

  constructor(private dataSourceAccessor: () => any[]) {}

  private isRowSelectable(item: { selectable?: boolean }): boolean {
    return item.selectable !== false;
  }

  private areAllRowsSelected(dataGrid: dxDataGrid): boolean | undefined {
    const selectableItems = this.dataSourceAccessor().filter(this.isRowSelectable) as any;
    const selectedRowKeys = dataGrid.getSelectedRowKeys();

    if (!selectedRowKeys?.length || !selectableItems?.length) {
      return false;
    }
    return selectedRowKeys.length >= selectableItems.length ? true : undefined;
  }

  public onSelectionChanged(e: SelectionChangedEvent<any, number>) {
    this.deselectAllUnselectableRows(e);
    this.updateSelectAllCheckBoxValue(e);
  }

  public onEditorPreparing(e: EditorPreparingEvent) {
    const isSelectionEditorEvent: boolean = (e as any).type === 'selection';
    if (!isSelectionEditorEvent) return;

    if (e.parentType === 'dataRow') {
      this.disableSelectionCheckboxIfRowIsNotSelectable(e);
    }
    if (e.parentType === 'headerRow') {
      this.setupSelectAllCheckBox(e);
    }
  }

  private updateSelectAllCheckBoxValue(e: SelectionChangedEvent<any, number>) {
    const dataGrid: dxDataGrid = e.component;
    this.selectAllCheckBoxUpdating = true;
    this.selectAllCheckBox.option('value', this.areAllRowsSelected(dataGrid));
    this.selectAllCheckBoxUpdating = false;
  }

  private deselectAllUnselectableRows(e: SelectionChangedEvent<any, number>) {
    const dataGrid: dxDataGrid = e.component;
    const deselectRowKeys: number[] = [];

    e.selectedRowsData.forEach((item) => {
      if (!this.isRowSelectable(item)) deselectRowKeys.push(dataGrid.keyOf(item));
    });
    if (deselectRowKeys.length) {
      dataGrid.deselectRows(deselectRowKeys);
    }
  }

  private disableSelectionCheckboxIfRowIsNotSelectable(e: EditorPreparingEvent) {
    if (e.row && !this.isRowSelectable(e.row.data)) {
      e.editorOptions.disabled = true;
    }
  }

  private setupSelectAllCheckBox(e: EditorPreparingEvent) {
    const dataGrid = e.component;
    // set initial value for select all checkbox
    const selectAllCheckboxEditor = e.editorOptions;
    selectAllCheckboxEditor.value = this.areAllRowsSelected(dataGrid);
    // get instance of select all checkbox component
    selectAllCheckboxEditor.onInitialized = (e: InitializedEvent) => {
      if (e.component) this.selectAllCheckBox = e.component;
    };
    selectAllCheckboxEditor.onValueChanged = (e: ValueChangedEvent) => {
      this.onSelectAllCheckBoxValueChanged(e, dataGrid);
    };
  }

  private onSelectAllCheckBoxValueChanged(e: ValueChangedEvent, dataGrid: dxDataGrid) {
    const shouldIgnoreEvent: boolean = this.preservePreviousvalueIfValueChangedProgrammatically(e);
    if (shouldIgnoreEvent) return;

    // if table state matches checkbox state, do nothing
    if (this.areAllRowsSelected(dataGrid) === e.value) return;

    // update table state to match checkbox state
    e.value ? dataGrid.selectAll() : dataGrid.deselectAll();
    e.event?.preventDefault();
  }

  private preservePreviousvalueIfValueChangedProgrammatically(e: ValueChangedEvent): boolean {
    if (!e.event) {
      if (e.previousValue && !this.selectAllCheckBoxUpdating) {
        e.component.option('value', e.previousValue);
      }
      return true;
    }
    return false;
  }
}
