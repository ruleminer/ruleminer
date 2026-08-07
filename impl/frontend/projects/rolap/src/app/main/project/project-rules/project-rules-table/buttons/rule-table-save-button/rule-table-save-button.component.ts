import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { switchMap, take } from 'rxjs';

import { faFloppyDisk } from '@fortawesome/pro-solid-svg-icons';

import { ModalService } from '../../../../../../common/services/modal/modal.service';
import { RuleSetService } from '../../../../../../common/services/rule-set/rule-set.service';
import { ProcessTabInfoComponent } from '../../../../process/process-tab-info/process-tab-info.component';
import { ProjectSaveRulesTableModalComponent } from './project-save-rules-table-modal/project-save-rules-table-modal.component';
import { ResultFromSaveRulesTableModal } from './project-save-rules-table-modal/types';

@Component({
  selector: 'rolap-rule-table-save-button',
  templateUrl: './rule-table-save-button.component.html',
  styleUrls: ['./rule-table-save-button.component.scss'],
})
export class RuleTableSaveButtonComponent {
  public faFloppyDisk = faFloppyDisk;

  private modalService = inject(ModalService);
  private ruleSetService = inject(RuleSetService);
  private destroyRef = inject(DestroyRef);

  public openSaveModal(): void {
    this.modalService
      .open(ProjectSaveRulesTableModalComponent, `project.rules.save_modal.title`, '500px')
      .pipe(
        switchMap((modalRef) => modalRef.getResult<ResultFromSaveRulesTableModal>()),
        filterOutNullish(),
        switchMap((modalResult) => this.ruleSetService.saveOrOverwriteRuleSet(modalResult)),
        filterOutNullish(),
        takeUntilDestroyed(this.destroyRef),
        take(1),
      )
      .subscribe((modalData) => {
        this.modalService.open(
          ProcessTabInfoComponent,
          'process.info_modal.content.saving_process_started',
          '400px',
          undefined,
          modalData,
        );
      });
  }
}
