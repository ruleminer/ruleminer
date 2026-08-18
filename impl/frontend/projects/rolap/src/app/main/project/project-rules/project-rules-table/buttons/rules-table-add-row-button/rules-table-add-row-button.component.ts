import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, map, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';

import { ModalPositions, ModalService } from '../../../../../../common/services/modal/modal.service';
import { AppState } from '../../../../../../common/store/app-state.model';
import { Ids } from '../../../../../../common/store/ruleSets/rulesets.selectors';
import { V2RulesTableActions } from '../../../../../../common/store/v2RulesTable/v2RulesTable.action';
import { convertJson } from '../../../../../data-upload/utils/utils';
import { RefreshService } from '../../../../service/refresh.service';
import { ManualRuleGeneratorComponent } from '../../../modals/project-generate-rule-set-modal/manual-rule-generator/manual-rule-generator.component';

@Component({
  selector: 'rolap-rules-table-add-row-button',
  templateUrl: './rules-table-add-row-button.component.html',
  styleUrls: ['./rules-table-add-row-button.component.scss'],
})
export class RulesTableAddRowButtonComponent {
  @Input({ required: true }) ids!: Ids;

  private store = inject(Store<AppState>);
  private modalService = inject(ModalService);
  private refreshService = inject(RefreshService);
  private destroyRef = inject(DestroyRef);

  public addRow(): void {
    this.modalService
      .open(
        ManualRuleGeneratorComponent,
        'project.rules.add_new_modal.title_generate',
        '800px',
        'auto',
        { dataSetId: this.ids.dataSetId, ruleSetId: this.ids.ruleSetId, isRuleTable: true },
        { closeOnBackdropClick: true, position: ModalPositions.CENTER, closeOnEscapeClick: false },
      )
      .pipe(
        switchMap((modalRef) => modalRef.getResult<{ rules: any }>().pipe(filter(Boolean))),
        map(({ rules }) =>
          rules.length === 1
            ? V2RulesTableActions.addRowToCurrentTable({ newRow: convertJson(rules[0]), isUserAction: true })
            : V2RulesTableActions.addMultipleRowsToCurrentTable({
                newRows: rules.map(convertJson),
                isUserAction: true,
              }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(async (action) => {
        this.store.dispatch(action);
        setTimeout(async () => {
          await this.refreshService.updateAllRulesTabDataForNewRules(this.ids);
        }, 3000);
      });
  }
}
