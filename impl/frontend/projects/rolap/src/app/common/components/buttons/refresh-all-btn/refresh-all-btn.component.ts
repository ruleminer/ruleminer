import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../utils/rxjsUtils';
import { EMPTY, combineLatest, map, of, switchMap, take } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowsRotate, faCheck } from '@fortawesome/pro-regular-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';

import { NotifyService } from '../../../services/notify/notify.service';
import { AppState, RefreshAllState, SubTabsNames, refreshAll } from '../../../store/app-state.model';
import { selectRefreshBtnState, selectRefreshPredictionIndicatorsAll } from '../../../store/ruleSets/rulesets.reducer';
import { isSelectedDataSetAvivable } from '../../../store/ruleSets/rulesets.selectors';
import { selectCurrentV2RulesTableIsNumberOfFilteredRowZero } from '../../../store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentSubTabName } from '../../../store/v2Tabs/v2Tabs.selectors';

@Component({
  selector: 'rolap-refresh-all-btn',
  templateUrl: './refresh-all-btn.component.html',
  styleUrls: ['./refresh-all-btn.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule, DxButtonModule],
})
export class RefreshAllBtnComponent {
  @Output() clickEvent = new EventEmitter<Promise<void>>();

  private store = inject(Store<AppState>);
  private notifyService = inject(NotifyService);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  public rulesTableRefreshAll$ = this.store.select(selectRefreshBtnState);
  public predictionIndicatorsRefreshAll$ = this.store.select(selectRefreshPredictionIndicatorsAll);
  private currentSubTab$ = this.store.select(selectCurrentSubTabName).pipe(filterOutNullish());
  private isSelectedDataSetAvivable$ = this.store.select(isSelectedDataSetAvivable);

  public btnState$ = combineLatest([
    this.rulesTableRefreshAll$,
    this.predictionIndicatorsRefreshAll$,
    this.currentSubTab$,
  ]).pipe(
    switchMap(([rulesTableRefreshAll, predictionIndicatorsRefreshAll, currentSubTab]) => {
      if (currentSubTab === SubTabsNames.RULES) {
        return of(this.convertRefreshStateToBtnObject(rulesTableRefreshAll, false));
      } else if (currentSubTab === SubTabsNames.PREDICTION_STATISTICS) {
        return this.isSelectedDataSetAvivable$.pipe(
          map((isSelectedDataSetAvivable) => {
            // We want to disable button if there is no selected data set on prediction_statistics tab
            const disabled = !isSelectedDataSetAvivable;
            return this.convertRefreshStateToBtnObject(predictionIndicatorsRefreshAll, disabled);
          }),
        );
      }
      return EMPTY;
    }),
  );

  public onClick() {
    this.store
      .select(selectCurrentV2RulesTableIsNumberOfFilteredRowZero)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((isZero) => {
        if (!isZero) return this.clickEvent.emit();
        const zeroRowsWarrning = this.translateService.instant('project.rules.table_info.table_is_empty');
        this.notifyService.showNotify(zeroRowsWarrning, 'warning', true);
      });
  }

  private convertRefreshStateToBtnObject(state: refreshAll, disabled: boolean) {
    const themeMap: Record<string, string> = {
      hidden: 'gray',
      clickable: 'orange',
      processing_data: 'gray',
      success: 'green',
    };
    const translationKeyMap: Record<string, string> = {
      clickable: 'project.prediction.update_btn.update',
      processing_data: 'project.prediction.update_btn.processing',
      success: 'project.prediction.update_btn.updated',
    };
    const iconMap: Record<string, any> = {
      clickable: faArrowsRotate,
      processing_data: faArrowsRotate,
      success: faCheck,
    };

    return {
      state,
      color: themeMap[state] || 'gray',
      translationKey: translationKeyMap[state] || '',
      icon: iconMap[state] || null,
      show: state !== RefreshAllState.HIDDEN,
      spin: state === RefreshAllState.PROCESSING_DATA,
      disabled,
    };
  }
}
