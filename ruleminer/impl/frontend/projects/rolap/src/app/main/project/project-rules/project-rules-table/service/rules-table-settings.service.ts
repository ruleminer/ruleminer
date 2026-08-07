import { Injectable } from '@angular/core';

import { RuleTableUse, SubTabsNames } from '../../../../../common/store/app-state.model';
import { BigTableSettings, DisplayType } from '../models/rules-table';

@Injectable({
  providedIn: 'root',
})
export class RulesTableSettingsService {
  public getAllProjectRulesTableSettings(displayType: DisplayType): BigTableSettings {
    return {
      showRefreshButton: this.getShowRefreshButton(displayType),
      isCompareTable: this.getIsCompareTable(displayType),
      editable: this.getEditable(displayType),
      dataFromApi: this.getDataFromApi(displayType),
      displayInCard: this.getDisplayInCard(displayType),
      instanceSync: this.getInstanceSync(displayType),
      showSaveButton: true, //Display Save Button. Displays it only if editable is also true
      showExportButton: this.getShowExportButton(displayType), //Display Export csv exls buttons
      contextMenu: this.getContextMenu(displayType),
      selectRuleModal: this.getSelectRuleModal(displayType),
      addRulesButton: this.getAddRulesButton(displayType), //Display Add Rules Button in footer
      readonlyLabels: this.getReadonlyLabels(displayType),
      height: this.getHeight(displayType),
      shouldDisplayTooltip: this.shouldDisplayTooltip(displayType), //Should display info tooltip next to the title
      showUndoRedoButtons: this.shouldDisplayUndoRedoButtons(displayType),
      showDisplayFilterRows: this.shouldDisplayFilterRows(displayType),
    };
  }

  getShowRefreshButton(displayType: DisplayType) {
    const displayTypeThatHasRefreshButton: DisplayType[] = [
      SubTabsNames.RULES,
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
    ];
    return displayTypeThatHasRefreshButton.includes(displayType);
  }

  private getIsCompareTable(displayType: DisplayType): boolean {
    return false;
    // return displayType === RuleTableUse.RULE_COMPARISON_SECOND_TABLE;
  }

  private getEditable(displayType: DisplayType): boolean {
    const displayTypeThatIsEditable: DisplayType[] = [
      SubTabsNames.RULES_COVERAGE,
      SubTabsNames.RULES,
      SubTabsNames.EXAMPLE,
    ];
    return displayTypeThatIsEditable.includes(displayType);
  }

  private getDataFromApi(displayType: DisplayType): boolean {
    const displayTypeThatIsDataFromApi: DisplayType[] = [
      RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
      RuleTableUse.RULE_ADD_MODAL,
    ];
    return displayTypeThatIsDataFromApi.includes(displayType);
  }
  private getHeight(displayType: DisplayType): string | undefined {
    const displayTypeHeightSet: DisplayType[] = [RuleTableUse.RULE_ADD_MODAL];
    return displayTypeHeightSet.includes(displayType) ? '500px' : undefined;
  }

  private getDisplayInCard(displayType: DisplayType): boolean {
    const displayTypeThatIsDisplayedInCard: DisplayType[] = [
      RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
      SubTabsNames.RULES,
    ];
    return displayTypeThatIsDisplayedInCard.includes(displayType);
  }

  private getInstanceSync(displayType: DisplayType): boolean {
    const displayTypeThatIsInstanceSync: DisplayType[] = [
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
      SubTabsNames.RULES,
    ];
    return displayTypeThatIsInstanceSync.includes(displayType);
  }

  private getReadonlyLabels(displayType: DisplayType): boolean {
    const displayTypeThatIsReadonlyLabels: DisplayType[] = [
      RuleTableUse.RULE_ADD_MODAL,
      RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
      SubTabsNames.EXAMPLE,
    ];
    return displayTypeThatIsReadonlyLabels.includes(displayType);
  }

  private getAddRulesButton(displayType: DisplayType): boolean {
    const displayTypeThatIsAddRulesButton: DisplayType[] = [
      // RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
      SubTabsNames.RULES_COVERAGE,
      SubTabsNames.RULES,
    ];
    return displayTypeThatIsAddRulesButton.includes(displayType);
  }

  private getSelectRuleModal(displayType: DisplayType): boolean {
    return displayType === RuleTableUse.RULE_ADD_MODAL;
  }

  private getContextMenu(displayType: DisplayType): boolean {
    const displayTypeThatHasContextMenu: DisplayType[] = [
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
      SubTabsNames.RULES,
    ];
    return displayTypeThatHasContextMenu.includes(displayType);
  }

  private getShowExportButton(displayType: DisplayType): boolean {
    const displayTypeThatHasExportButton: DisplayType[] = [
      RuleTableUse.RULE_COMPARISON_SECOND_TABLE,
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
      SubTabsNames.RULES,
      SubTabsNames.EXAMPLE,
    ];
    return displayTypeThatHasExportButton.includes(displayType);
  }

  private shouldDisplayTooltip(displayType: DisplayType): boolean {
    const displayTypeThatHasTooltip: DisplayType[] = [
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
      SubTabsNames.RULES,
    ];
    return displayTypeThatHasTooltip.includes(displayType);
  }

  private shouldDisplayUndoRedoButtons(displayType: DisplayType): boolean {
    const displayTypeThatHasUndoRedoButtons: DisplayType[] = [
      SubTabsNames.RULES,
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
    ];
    return displayTypeThatHasUndoRedoButtons.includes(displayType);
  }

  private shouldDisplayFilterRows(displayType: DisplayType): boolean {
    const displayTypeThatHasUndoRedoButtons: DisplayType[] = [
      SubTabsNames.RULES,
      SubTabsNames.RULE_COMPARISON,
      SubTabsNames.RULES_COVERAGE,
    ];
    return displayTypeThatHasUndoRedoButtons.includes(displayType);
  }
}
