import { Component, EventEmitter, Input, Output, Signal, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { filterOutNullish } from '../../../../../../common/utils/rxjsUtils';
import { Observable, combineLatest, debounceTime, map } from 'rxjs';

import { Store } from '@ngrx/store';
import { SelectionChangedEvent } from 'devextreme/ui/list';

import { AppState } from '../../../../../../common/store/app-state.model';
import { ProblemTypes } from '../../../../../data-upload/utils/enums';
import { EDITOR_STATE_SERVICE_TOKEN } from '../service/editor-state/editor-state.provider';
import { RulesEditorConfig, RulesEditorDisplayTypes } from '../types/rules-editor';
import { activeProjectProblemTypeSelector } from '../../../../../../common/store/project/project.selectors';

@Component({
  selector: 'rolap-rules-editor-side-column',
  templateUrl: './rules-editor-side-column.component.html',
  styleUrls: ['./rules-editor-side-column.component.scss'],
})
export class RulesEditorSideColumnComponent {
  @Input() decisionAttributeName: string;
  @Output() setShowConfirmModalTrue = new EventEmitter<void>();
  private store = inject(Store<AppState>);
  private editorStateService = inject(EDITOR_STATE_SERVICE_TOKEN, { skipSelf: true });
  public problemType$ = this.store.select(activeProjectProblemTypeSelector).pipe(filterOutNullish());

  private nominalAttributesSignal = this.editorStateService.nominalAttributesSig;
  private problemTypeSignal = toSignal(this.store.select(activeProjectProblemTypeSelector).pipe(filterOutNullish()));
  public isClassification = computed(() => this.problemTypeSignal() === ProblemTypes.Classification);
  public configSignal: Signal<RulesEditorConfig | null> = this.editorStateService.configSignal;

  public decisionAttributeValuesSignal = computed(() => {
    const nominalAttributes = this.nominalAttributesSignal();
    if (!nominalAttributes) return null;
    if (!nominalAttributes || !this.decisionAttributeName || !nominalAttributes[this.decisionAttributeName]) {
      return [];
    }
    return nominalAttributes[this.decisionAttributeName]
  });

  public conclusionDropDownItems$ = toObservable(this.editorStateService.conclusionDropDownItemsSignal);
  private readonly coverage$ = toObservable(this.editorStateService.coverage);
  private readonly distribution$ = toObservable(this.editorStateService.distributionSignal);
  private readonly editorConclusionState$ = toObservable(this.editorStateService.editorConclusionState);
  public readonly displayedMetrics$ = toObservable(this.editorStateService.displayedMetrics);
  public readonly displayType$ = toObservable(this.editorStateService.displayTypeSig);

  public selectedItemKeys: any = [];

  public isSideBarReady$: Observable<boolean> = combineLatest([
    this.problemType$,
    this.conclusionDropDownItems$,
    this.coverage$,
    this.distribution$,
    this.editorConclusionState$,
    this.displayedMetrics$,
    this.displayType$,
  ]).pipe(
    debounceTime(100),
    map(
      ([
        problemType,
        conclusionDropDownItems,
        coverage,
        distribution,
        editorConclusionState,
        displayedMetrics,
        displayType,
      ]) => {
        if (!problemType || !displayType) return false;
        if (problemType === ProblemTypes.Classification) {
          if (
            [
              RulesEditorDisplayTypes.EXPERT_RULES,
              RulesEditorDisplayTypes.EXPERT_FORBIDDEN_CONDITIONS,
              RulesEditorDisplayTypes.EXPERT_PREFERRED_CONDITIONS,
            ].includes(displayType)
          ) {
            return true;
          }
          if (!editorConclusionState) return false;
          const conclusioneditorSelectedValueObj = Array.isArray(editorConclusionState)
            ? editorConclusionState[0]
            : editorConclusionState;
          const isConclusioneditorSelectedValueObjDefined = conclusioneditorSelectedValueObj.value;
          if (
            !coverage?.length ||
            !distribution ||
            !editorConclusionState ||
            !isConclusioneditorSelectedValueObjDefined ||
            !displayedMetrics ||
            displayedMetrics.length === 0
          ) {
            return false;
          }
          return conclusionDropDownItems.length > 0;
        } else if (problemType === ProblemTypes.Regression) {
          if (
            [
              RulesEditorDisplayTypes.EXPERT_RULES,
              RulesEditorDisplayTypes.EXPERT_FORBIDDEN_CONDITIONS,
              RulesEditorDisplayTypes.EXPERT_PREFERRED_CONDITIONS,
            ].includes(displayType)
          ) {
            return true;
          }
          if (!displayedMetrics || displayedMetrics.length === 0) return false;
          return true;
        } else if (problemType === ProblemTypes.Survival) {
          if (
            [
              RulesEditorDisplayTypes.EXPERT_RULES,
              RulesEditorDisplayTypes.EXPERT_FORBIDDEN_CONDITIONS,
              RulesEditorDisplayTypes.EXPERT_PREFERRED_CONDITIONS,
            ].includes(displayType)
          ) {
            return true;
          }
          if (!editorConclusionState) return false;
          return true;
        }
        return true;
      },
    ),
  );

  public onNominalAttributeChange(event: SelectionChangedEvent): void {
    this.editorStateService.setConclusionSignal({ value: event.addedItems[0] });
    const addedItemsAsObjects = [...this.selectedItemKeys].map((item) => ({ value: item }));
    this.editorStateService.setEditorConclusionState(addedItemsAsObjects);
    this.setShowConfirmModalTrue.emit();
  }

  public preferredConditionCount: number = 0;

  public updatePreferredConditionCount(newCount: number): void {
    this.preferredConditionCount = newCount;
    this.editorStateService.preferredConditionCountSignal.set(newCount);
  }
}

