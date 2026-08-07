import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subject, distinctUntilChanged, filter, shareReplay, takeUntil } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { Store, select } from '@ngrx/store';
import { isEqual } from 'lodash';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';

import { FieldName } from '../../../../../../common/components/validation-message/validation-message.component';
import { V2TabsActions } from '../../../../../../common/store/v2Tabs/v2Tabs.action';
import { selectCurrentV2Tab, selectCurrentV2TabIds } from '../../../../../../common/store/v2Tabs/v2Tabs.selectors';
import {
  CustomDescriptionDatasetValidation,
  CustomTitleDatasetValidation,
} from '../../../../../data-upload/utils/formValidators';

@Component({
  selector: 'rolap-dataset-description-form',
  templateUrl: './dataset-description-form.component.html',
  styleUrls: ['./dataset-description-form.component.scss'],
})
export class DatasetDescriptionFormComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  public FieldName = FieldName;
  private ngUnsubscribe = new Subject<void>();

  public ids$ = this.store.pipe(select(selectCurrentV2TabIds)).pipe(
    distinctUntilChanged(isEqual),
    filter((ids) => !!ids?.dataSetId),
    tap(() => this.setUpForm()),
    shareReplay(1),
    takeUntil(this.ngUnsubscribe),
  );

  constructor(
    private store: Store<AppState>,
    private formBuilder: FormBuilder,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.ids$
      .pipe(
        switchMap(() => this.store.pipe(select(selectCurrentV2Tab))),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((v2Tab) => {
        if (!v2Tab) return;
        const { text, description } = v2Tab;
        this.form.controls['title'].setValue(text, { emitEvent: false });
        this.form.controls['description'].setValue(description, { emitEvent: false });
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public submit(): void {
    const body = {
      name: this.form.controls['title'].value,
      description: this.form.controls['description'].value,
    };

    this.store.dispatch(V2TabsActions.setCurrentTabDescriptionAndName(body));
  }

  private setUpForm(): void {
    this.form = this.formBuilder.group({
      title: ['', CustomTitleDatasetValidation],
      description: ['', CustomDescriptionDatasetValidation],
    });

    this.form.reset();
    this.form.controls['title'].setErrors(null);
    this.form.controls['description'].setErrors(null);
    this.form.updateValueAndValidity();
    this.changeDetector.detectChanges();
  }
}
