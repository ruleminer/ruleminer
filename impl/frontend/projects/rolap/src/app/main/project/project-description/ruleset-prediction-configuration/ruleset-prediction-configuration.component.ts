import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { filterOutNullish } from 'projects/rolap/src/app/common/utils/rxjsUtils';
import { Observable, Subject, distinctUntilChanged, of, switchMap, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxLoadIndicatorModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { isEqual } from 'lodash';
import { CardModule } from 'projects/rolap/src/app/common/components/card/card.module';
import { AppState } from 'projects/rolap/src/app/common/store/app-state.model';
import { selectPredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/predictionConfigOptions.selectors';
import { PredictionConfigOptions } from 'projects/rolap/src/app/common/store/predictionConfigOptions/types';
import { PredictionConfig } from 'projects/rolap/src/app/common/store/v2DetailsOfRuleSetGeneration/types';
import { getCurentTabRulesetPredictionConfig } from 'projects/rolap/src/app/common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.selectors';

import { V2DetailsOfRuleSetGenerationActions } from '../../../../common/store/v2DetailsOfRuleSetGeneration/v2DetailsOfRuleSetGeneration.action';
import { DisplayType, RulesetPredictionConfigurationComponentData } from './types';

@Component({
  selector: 'rolap-ruleset-prediction-configuration',
  templateUrl: './ruleset-prediction-configuration.component.html',
  styleUrls: ['./ruleset-prediction-configuration.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DxTextBoxModule,
    DxLoadIndicatorModule,
    DxButtonModule,
    DxSelectBoxModule,
    DxCheckBoxModule,
    CardModule,
  ],
  standalone: true,
})
export class RulesetPredictionConfigurationComponent implements OnChanges, OnDestroy {
  @Input() data: RulesetPredictionConfigurationComponentData;
  public formGroup: FormGroup;
  public predictionConfigOptions$: Observable<PredictionConfigOptions>;
  public predictionConfig$: Observable<PredictionConfig>;
  public formIsReadOnly = false;
  public showInCard: boolean = true;
  public floatingLabel: boolean = false;
  public className: string = '';
  private ngUnsubscribe = new Subject<void>();

  constructor(private store: Store<AppState>, private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.setup();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setup() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    if (!this.predictionConfigOptions$) {
      this.predictionConfigOptions$ = this.store.select(selectPredictionConfigOptions).pipe(filterOutNullish());
    }

    switch (this.data.displayType) {
      case DisplayType.RuleSetCreation:
        this.setupForRuleSetCreationDisplay();
        break;
      case DisplayType.RuleSetTab:
        this.setupForRuleSetTabDisplay();
        break;
      case DisplayType.RuleSetImport:
        this.setupForRuleSetImportDisplay();
        break;
      default:
        throw new Error(`unknown display type: ${this.data.displayType}`);
    }
  }

  private setupForRuleSetCreationDisplay() {
    if (!this.data.formGroup) throw new Error('form group should be set for selected display type');
    this.formGroup = this.data.formGroup;
    this.showInCard = false;
    this.predictionConfigOptions$.pipe(
      distinctUntilChanged(isEqual),
      switchMap((predictionConfigOptions: PredictionConfigOptions) => {
        return of({
          prediction_strategy: predictionConfigOptions.prediction_strategy.default,
          voting_measure: predictionConfigOptions.voting_measure.default,
          use_default_rule: false,
        } as PredictionConfig);
      }),
    );
  }

  private setupForRuleSetTabDisplay() {
    if (this.data.formGroup) throw new Error('form group should not be set for selected display type');
    this.formIsReadOnly = false;
    this.className = 'rules-set-tab-display';
    this.formGroup = this.fb.group({
      prediction_strategy: [null, [Validators.required]],
      voting_measure: [null, [Validators.required]],
      use_default_rule: [false],
    });
    this.showInCard = false;
    this.floatingLabel = false;

    this.store
      .select(getCurentTabRulesetPredictionConfig)
      .pipe(filterOutNullish(), takeUntil(this.ngUnsubscribe), take(1))
      .subscribe((predictionConfig: PredictionConfig) => {
        this.formGroup.patchValue(predictionConfig);
      });

    this.formGroup.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value: PredictionConfig) => {
      this.store.dispatch(V2DetailsOfRuleSetGenerationActions.setPredictionConfig({ predictionConfig: value }));
    });
  }

  private setupForRuleSetImportDisplay() {
    this.setupForRuleSetCreationDisplay();
    this.showInCard = false;
    this.floatingLabel = true;
  }
}
