import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, EventEmitter, Output, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import { of } from 'rxjs';
import { catchError, map, startWith, take } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { NotifyService } from '../../../../../common/services/notify/notify.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { selectComparisonDataToCompare } from '../../../../../common/store/v2Comparison/v2Comparison.selectors';
import { CompareCalculateSimilarityService } from '../../service/compare-calculate-similarity.service';
import { ComparisonCalulateSimilarityButtonOutput } from './types';

@Component({
  selector: 'rolap-calculate-similarity-button',
  templateUrl: './calculate-similarity-button.component.html',
  styleUrls: ['./calculate-similarity-button.component.scss'],
})
export class CalculateSimilarityButtonComponent {
  private readonly NOT_SUPPORTED_FOR_RULES_WITH_ALTERNATIVE_ERROR_CODE = 'not_supported_for_rules_with_alternatives';

  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  private comparisonCalculateSimilarityService = inject(CompareCalculateSimilarityService);
  private notifyService = inject(NotifyService);
  private translate = inject(TranslateService);

  public shouldShow = toSignal(
    this.store.select(selectComparisonDataToCompare).pipe(
      filterOutNullish(),
      map((data) => !!data),
      startWith(false),
    ),
    { requireSync: true },
  );
  @Output() onCalculatedData = new EventEmitter<ComparisonCalulateSimilarityButtonOutput>();

  public calculateSimilarity(): void {
    this.comparisonCalculateSimilarityService
      .calculateSimilarity()
      .pipe(
        take(1),
        catchError((httpError: HttpErrorResponse) => {
          if (httpError.error.err_msg_id === this.NOT_SUPPORTED_FOR_RULES_WITH_ALTERNATIVE_ERROR_CODE) {
            this.notifyService.showNotify(
              this.translate.instant(
                'toast_messages.errors.syntactic_comparison_not_supported_for_rules_with_alternatives',
              ),
              'error',
            );
            return of(null);
          }
          throw httpError;
        }),
        filterOutNullish(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((calculatedData) => this.onCalculatedData.emit(calculatedData));
  }
}
