import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

import { Subscription, take } from 'rxjs';

import { faArrowsRotate, faCircle, faCircleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { NotifyService } from '../../../services/notify/notify.service';
import { AppState } from '../../../store/app-state.model';
import { selectCurrentV2RulesTableIsNumberOfFilteredRowZero } from '../../../store/v2RulesTable/v2RulesTable.selectors';

@Component({
  selector: 'rolap-refresh-icon',
  templateUrl: './refresh-icon.component.html',
  styleUrls: ['./refresh-icon.component.scss'],
})
export class RefreshIconComponent implements OnDestroy {
  @Input() canRefresh: boolean;
  @Input() isRefreshing: boolean;
  @Output() refresh: EventEmitter<void> = new EventEmitter();

  public faArrowsRotate = faArrowsRotate;
  public faCircle = faCircle;
  public faCircleExclamation = faCircleExclamation;
  private subscription: Subscription;

  constructor(
    private store: Store<AppState>,
    private notifyService: NotifyService,
    private translateService: TranslateService,
  ) {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onIconClick(): void {
    this.subscription?.unsubscribe();
    if (!this.canRefresh) return;
    this.subscription = this.store
      .select(selectCurrentV2RulesTableIsNumberOfFilteredRowZero)
      .pipe(take(1))
      .subscribe((isNumberOfFilteredRowsZero) => {
        if (isNumberOfFilteredRowsZero)
          return this.notifyService.showNotify(
            this.translateService.instant('project.rules.table_info.table_is_empty'),
            'warning',
            true,
          );
        this.refresh.emit();
      });
  }
}
