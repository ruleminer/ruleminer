import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { ProblemTypes } from '../../../main/data-upload/utils/enums';
import { MappedItem } from '../../../main/project/dataset/models/treeview';
import { EditedRow, NewRow, RuleCoverage } from '../../../main/project/models/ruleset';
import { Label } from '../../components/label/interfaces/label.model';
import { Ids } from '../ruleSets/rulesets.selectors';
import { V2RulesTable, V2RulesTableData, v2AttributeMinMaxValues, v2LabelMinMaxValues, v2TableUndoData } from './types';

export const V2RulesTableActions = createActionGroup({
  source: 'V2 Rules Table Actions',
  events: {
    /* NGRX Entity Actions */
    Add: props<{ v2RulesTable: V2RulesTable }>(),
    Remove: props<{ key: string }>(),
    'Remove All': emptyProps(),

    /* Set V2 Table Properties */
    'Set Table Data For Current': props<{
      data: {
        table: V2RulesTableData;
        rulesIndicators: any;
        rulesCoverage: any;
      };
      ids: Ids;
    }>(), //TODO: remove ids from here we do not need them
    'Set Table Data For Current Complete': props<{
      key: string;
      data: {
        table: V2RulesTableData;
        rulesIndicators: any;
        rulesCoverage: any;
      };
    }>(),
    'Set Can Save': props<{ key: string; canSave: boolean }>(),
    'Set State': props<{ tableState: string }>(),
    'Set State Complete': props<{ key: string; tableState: string }>(),
    'Set Coverage For Current Tab': props<{ coverage: RuleCoverage }>(),
    'Set Coverage For Current Tab Complete': props<{ key: string; coverage: RuleCoverage }>(),
    'Set Coverage Needs Refetch For Current Tab': props<{ needsRefetch: boolean }>(),
    'Set Coverage Needs Refetch For Current Tab Complete': props<{ key: string; needsRefetch: boolean }>(),

    /* Update Table Row */
    'Update Current Table Row': props<{ editedRow: EditedRow; isUserAction: boolean }>(),
    'Update Current Table Row Complete': props<{
      key: string;
      editedRow: EditedRow;
      originalRow: any;
      isUserAction: boolean;
    }>(),

    /* Add Table Row */
    'Add Row To Current Table': props<{ newRow: NewRow; isUserAction: boolean }>(),
    /* Add Table Row - Add a new row to the current table on top. Update all rows autoIncrement values by one */
    'Add Row To Current Table Complete': props<{ key: string; newRow: NewRow }>(),

    'Add Multiple Rows To Current Table': props<{ newRows: NewRow[]; isUserAction: boolean }>(),
    'Add Multiple Rows To Current Table Complete': props<{ key: string; newRows: NewRow[] }>(),

    /* Remove Table Row */
    'Remove Row From Current Table': props<{ rowUuid: string; isUserAction: boolean }>(),
    /* Prepare Table DevExtreme State before removing row */
    'Prepare Table DevExtreme State Before Removing Row': props<{ key: string; rowUuid: string }>(),
    /* Remove Table Row - Remove a row from the current table by row uuid. Update all rows autoIncrement values by one */
    'Remove Row From Current Table Complete': props<{ key: string; rowUuid: string }>(),

    /* Remove Multiple Rows */
    'Remove Multiple Rows From Current Table': props<{ rowUuids: string[]; isUserAction: boolean }>(),
    'Prepare Table DevExtreme State Before Removing Rows': props<{ key: string; rowUuids: string[] }>(),
    'Remove Multiple Rows From Current Table Complete': props<{ key: string; rowUuids: string[] }>(),

    /*
     * Copy Rows From Current Table To Another Table
     * This action assumes that another table already exists !!!
     * Takes in UUIDs of rows from the current table that we want to copy to another table
     *
     * Arguments:
     * - currentTableRowsUuids: Set<string> - Set of UUIDs representing the rows to be copied from the current table to another table.
     * - anotherV2TableKey: string - The key identifier for the target table where the rows will be copied to.
     * - currentTableKey: string - The key identifier for the current table. The table from which the rows will be copied.
     */
    'Copy Rows From Current Table To Another Table': props<{
      currentTableRowsUuids: Set<string>;
      anotherV2TableKey: string;
      currentTableKey: string;
      targetIds: Ids;
      problemType: ProblemTypes;
    }>(),

    /* Active Column */
    /* Active Column - Update the active state of all rows For the current table */
    'Current Table Actives Header Toggle': props<{ activeValue: boolean }>(),
    'Current Table Actives Header Toggle Complete': props<{ key: string; activeValue: boolean }>(),
    /* Active Column - Toggle the active state of a row by row uuid For the current table */
    'Update Current Table Row Active State': props<{ rowUuid: string }>(),
    'Update Current Table Row Active State Complete': props<{ key: string; rowUuid: string }>(),

    /* Compare Column */
    /* Active Column - Toggle the Compare state of a row by row uuid For the current table */
    'Update Current Table Row Compare State': props<{ rowUuid: string; isRelationOneToMany: boolean }>(),
    'Update Current Table Row Compare State Complete': props<{
      key: string;
      rowUuid: string;
      isRelationOneToMany: boolean;
    }>(),

    /* Labels */
    /* Labels - Update label in every row of the table & all tables. When label gets edited we want to updated it everywhere */
    'Update Labels in All Tables': props<{ label: Label }>(),
    /* Labels - Overwite labels in a table row by rowUuid For the current table */
    'Overwrite Labels To Current Table Row': props<{ rowUuid: string; labels: Label[] }>(),
    'Overwrite Labels To Current Table Rows Complete': props<{ key: string; rowUuid: string; labels: Label[] }>(),
    /* Labels - Remove a label from a row by rowUuid For the current table */
    'Remove Label From Row In Current Table': props<{ rowUuid: string; labelId: Label['id'] }>(),
    'Remove Label From Row In Current Table Complete': props<{ key: string; rowUuid: string; labelId: Label['id'] }>(),
    /* Labels - Remove all label occurrences from the all v2Tables */
    'Remove All Label Occurences From all Tables': props<{ labelId: Label['id'] }>(),

    /* Compare */
    /* Compare - Mark Rule Set To Compare */
    'Mark Rule Set To Compare In Current Table': props<{ single: boolean; uuid: string }>(), //TODO: add better description, or change to better name. Ask Dawid for more info
    'Mark Rule Set To Compare In Current Table Complete': props<{ key: string; single: boolean; uuid: string }>(),
    /* Compare - Mark All Rule Sets To Compare */
    'Mark All Rule Sets To Compare In Current Table': props<{ checkboxState: boolean }>(),
    'Mark All Rule Sets To Compare In Current Table Complete': props<{ key: string; checkboxState: boolean }>(),
    /* Compare - Mark first Rule Set To Compare */
    'Mark First Rule Set To Compare In Current Table': emptyProps(), //TODO: add better description, or change to better name. Ask Dawid for more info
    'Mark First Rule Set To Compare In Current Table Complete': props<{ key: string }>(),

    /* Attributes Min Max Values */
    /* Attributes Min Max Values - Set Attributes Min Max Values */
    'Set Attributes Min Max Values In Current Table': props<{
      labelMinMaxValues: v2LabelMinMaxValues;
      attributesMinMaxValues: v2AttributeMinMaxValues;
    }>(),
    'Set Attributes Min Max Values In Current Table Complete': props<{
      key: string;
      labelMinMaxValues: v2LabelMinMaxValues;
      attributesMinMaxValues: v2AttributeMinMaxValues;
    }>(),
    /* UNDO REDO */
    /* UNDO */
    'Add action to undo stack': props<{ undoData: v2TableUndoData }>(),
    'Add action to undo stack complete': props<{ key: string; undoData: v2TableUndoData }>(),
    'Clear redo stack': props<{ key: string }>(),

    /* Undo and Redo */
    'Undo action': emptyProps(),
    'Redo action': emptyProps(),
    'Perform undo redo action': props<{ key: string; actionType: 'undo' | 'redo'; data: v2TableUndoData }>(),
    'Undo action complete': props<{ key: string; data: v2TableUndoData }>(),
    'Redo action complete': props<{ key: string; data: v2TableUndoData }>(),

    /* Filtered Uuids */
    'Update Filtered Rows Uuids': props<{ filteredRowsUuids: string[] }>(),
    'Update Filtered Rows Uuids Complete': props<{ key: string; filteredRowsUuids: string[] }>(),

    /* Sorting */
    'Set Should Go To The First Page On Sort': props<{ shouldGoToTheFirstPageOnSort: boolean }>(),
    'Set Should Go To The First Page On Sort Complete': props<{ key: string; shouldGoToTheFirstPageOnSort: boolean }>(),

    //Set refresh for all tables
    'Set Refresh For All Tables': props<{ ids: Ids }>(),

    'Copy Rows From Current Table To Another Table that is already opened': props<{
      currentTableRowsUuids: Set<string>;
      targetNgrxKey: string;
      targetIds: Ids;
      sourceTableKey: string;
    }>(),
    'Copy Rows From Current Table To Another Table that is already opened Compleat': props<{
      targetIds: Ids;
    }>(),

    'Copy Rows From Current Table To Another Table that is closed': props<{
      currentTableRowsUuids: Set<string>;
      targetNgrxKey: string;
      targetIds: Ids;
      selectedItem: MappedItem;
      sourceTableKey: string;
    }>(),
  },
});
