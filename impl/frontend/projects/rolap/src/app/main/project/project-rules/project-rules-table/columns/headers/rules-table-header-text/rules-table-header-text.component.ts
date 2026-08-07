/**
 * `RulesTableHeaderTextComponent` is a component used to display text in column headers and in the custom column chooser. * This component calculates the display text based on the `dataField` property of the column,
 * the current projeproblemType, the display type of the RulesTableComponent and the current language (pl/en).
 *
 * The component is used in the `RulesTableComponent` and `RulesTableColumnChooserComponent`.
 * RulesTableComponent should use this component to display the column headers.\
 * RulesTableColumnChooserComponent should use this component to display items in the column chooser.
 *
 * Here is an example of how to use it in the `RulesTableComponent`:
 */
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { RuleTableUse, SubTabsNames } from '../../../../../../../common/store/app-state.model';
import { ProblemTypes } from '../../../../../../data-upload/utils/enums';
import { DataField } from '../../../../../service/models/rules-customize-columns-api';
import { RulesCustomizeColumnsService } from '../../../../../service/rules-customize-columns.service';

@Component({
  selector: 'rolap-rules-table-header-text',
  templateUrl: './rules-table-header-text.component.html',
  styleUrls: ['./rules-table-header-text.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
})
export class RulesTableHeaderTextComponent implements OnChanges {
  @Input() problemType: ProblemTypes;
  @Input() displayType: SubTabsNames | RuleTableUse;
  @Input() dataField: DataField;
  public headerText: string;

  constructor(private rulesCustomizeColumnsService: RulesCustomizeColumnsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataField'] || changes['displayType'] || changes['problemType']) this.updateHeaderText();
  }

  private updateHeaderText(): void {
    const translateKey = this.rulesCustomizeColumnsService.getHeaderTextBasedOnDataField(
      this.dataField,
      this.displayType,
      this.problemType,
    );
    this.headerText =
      this.displayType === SubTabsNames.DATASET ? translateKey : `project.rules.table.headers.${translateKey}`;
  }
}
