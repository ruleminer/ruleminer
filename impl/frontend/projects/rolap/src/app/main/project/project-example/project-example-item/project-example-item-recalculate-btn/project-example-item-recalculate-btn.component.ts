import { Component, DestroyRef, Input, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { take } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { NotifyService } from '../../../../../common/services/notify/notify.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { V2ClassifyCardActions } from '../../../../../common/store/v2Classify/v2Classify.action';
import { selectCurrentV2RulesTableIsNumberOfFilteredRowZero } from '../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { ClassifyService } from '../../classify.service';

@Component({
  selector: 'rolap-project-example-item-recalculate-btn',
  templateUrl: './project-example-item-recalculate-btn.component.html',
  styleUrls: ['./project-example-item-recalculate-btn.component.scss'],
})
export class ProjectExampleItemRecalculateBtnComponent {
  @Input({ required: true }) cardKey: string;

  private store = inject(Store<AppState>);
  private notifyService = inject(NotifyService);
  private translateService = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private classifyService = inject(ClassifyService);
  private columnsTypes = this.classifyService.columnsTypes;
  private labelAttribute = this.classifyService.labelAttribute;

  public isDisabled = computed(() => {
    const labelAttribute = this.labelAttribute();
    return labelAttribute ? false : true;
  });

  public onCalculateBtnClick(): void {
    this.store
      .select(selectCurrentV2RulesTableIsNumberOfFilteredRowZero)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((isNumberOfFilteredRowsZero) => {
        if (isNumberOfFilteredRowsZero) {
          this.notifyService.showNotify(
            this.translateService.instant('project.rules.table_info.table_is_empty'),
            'warning',
            true,
          );
          return;
        }

        // Delay to first update the data in the table and then recalculate the data
        setTimeout(() => this.calculate(), 250);
      });
  }

  private calculate() {
    const labelAttribute = this.labelAttribute();
    if (!labelAttribute) return;
    this.store.dispatch(
      V2ClassifyCardActions.recalculate({
        key: this.cardKey,
        labelAttribute: labelAttribute,
        columnsTypes: this.columnsTypes,
      }),
    );
  }
}
