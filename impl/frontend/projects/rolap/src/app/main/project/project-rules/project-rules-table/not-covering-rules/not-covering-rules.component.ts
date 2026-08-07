import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { filterOutNullish } from '../../../../../common/utils/rxjsUtils';
import { BehaviorSubject, filter, map, of, switchMap, take, tap } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronRight, faPencil, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxButtonModule, DxDataGridComponent } from 'devextreme-angular';

import { CommentsService } from '../../../../../common/services/comments/comments.service';
import { ModalRef } from '../../../../../common/services/modal/modal-ref';
import { ModalPositions, ModalService } from '../../../../../common/services/modal/modal.service';
import { NotifyService } from '../../../../../common/services/notify/notify.service';
import { AppState } from '../../../../../common/store/app-state.model';
import { V2RulesTableActions } from '../../../../../common/store/v2RulesTable/v2RulesTable.action';
import {
  selectCurrentV2RulesShouldGoToTheFirstPageOnSort,
  selectCurrentV2RulesTableMeta,
} from '../../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { selectCurrentV2TabIds } from '../../../../../common/store/v2Tabs/v2Tabs.selectors';
import { ProjectRulesTableEditorComponent } from '../project-rules-table-editor/project-rules-table-editor.component';
import {
  RulesEditorDisplayTypes,
  RulesTableEditorModalSettings,
} from '../project-rules-table-editor/types/rules-editor';

@Component({
  selector: 'rolap-not-covering-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule, DxButtonModule],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0',
          opacity: 0,
          overflow: 'hidden',
        }),
      ),
      state(
        'expanded',
        style({
          height: '*',
          opacity: 1,
        }),
      ),
      transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
    ]),
    trigger('rotateIcon', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
    ]),
  ],
  template: `
    <ng-container *ngIf="comments$ | async as comments">
      <ng-container *ngIf="comments.length > 0">
        <div class="collapsible-container">
          <div class="collapsible-header" (click)="toggleExpand()">
            <div class="title-container">
              <span class="toggle-icon" [@rotateIcon]="isExpanded ? 'expanded' : 'collapsed'">
                <fa-icon [icon]="faChevronDown"></fa-icon>
              </span>
              <h4>{{ 'project.rules.not_covered_rules.title' | translate }}</h4>
              <dx-button class="title-button" stylingMode="outlined" (click)="onDismiss()">{{
                'project.rules.not_covered_rules.button' | translate
              }}</dx-button>
            </div>
          </div>

          <div class="collapsible-content" [@expandCollapse]="isExpanded ? 'expanded' : 'collapsed'">
            <div class="not-covering-rules-container">
              <div class="header">
                <h4>{{ 'project.rules.not_covered_rules.details' | translate }}</h4>
              </div>
              <div class="rules-list">
                <div *ngFor="let rule of comments" class="rule-item">
                  <div class="rule-actions">
                    <button class="icon-button edit-button" (click)="onEdit(rule)">
                      <fa-icon [icon]="faPencil"></fa-icon>
                    </button>
                    <button class="icon-button delete-button" (click)="onDelete(rule)">
                      <fa-icon [icon]="faTrash"></fa-icon>
                    </button>
                  </div>
                  <span class="rule-text">{{ rule.string }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </ng-container>
  `,
  styleUrls: ['./not-covering-rules.component.scss'],
})
export class NotCoveringRulesComponent {
  @Input() dataGrid: DxDataGridComponent;
  public isExpanded = true;
  public faChevronDown = faChevronDown;
  public faChevronRight = faChevronRight;
  public faPencil = faPencil;
  public faTrash = faTrash;
  private commentsSubject = new BehaviorSubject<any[]>([]);
  public comments$ = this.commentsSubject.asObservable();
  private commentsService = inject(CommentsService);
  private store = inject(Store<AppState>);
  private modalService = inject(ModalService);
  private notifyService = inject(NotifyService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private ids$ = this.store.select(selectCurrentV2TabIds).pipe(filterOutNullish());

  public toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  ngOnInit(): void {
    this.loadComments();
  }

  public onDismiss(): void {
    this.ids$
      .pipe(
        take(1),
        switchMap((ids) => {
          if (!ids?.dataSetId || !ids?.ruleSetId) return of(null);
          return this.commentsService.updateComment(ids.dataSetId, ids.ruleSetId, {
            comments: [],
          });
        }),
        tap(() => this.commentsSubject.next([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.notifyService.showNotify(
          this.translate.instant('project.rules.not_covered_rules.remove_rules'),
          'success',
        );
      });
  }

  public onEdit(rule: any): void {
    const selectedRow = rule;

    this.ids$
      .pipe(
        take(1),
        switchMap((ids) => {
          return this.store.select(selectCurrentV2RulesTableMeta).pipe(
            filterOutNullish(),
            take(1),
            switchMap((meta) => {
              const MODAL_SETTINGS: RulesTableEditorModalSettings = {
                ids,
                autoIncrement: 1,
                uuid: selectedRow.uuid,
                selectedRow,
                decisionAttributeName: meta.decision_attribute,
                displayType: RulesEditorDisplayTypes.RULE_EDITING_NOT_COVERED,
              };

              return this.modalService
                .open(
                  ProjectRulesTableEditorComponent,
                  'project.rules.not_covered_rules.edit_modal',
                  '100%',
                  '100%',
                  { MODAL_SETTINGS },
                  {
                    closeOnBackdropClick: true,
                    position: ModalPositions.CENTER,
                    closeOnEscapeClick: false,
                  },
                )
                .pipe(
                  switchMap((modalRef: ModalRef<ProjectRulesTableEditorComponent>) =>
                    modalRef.getResult<any>().pipe(
                      filter((res) => res !== undefined),
                      take(1),
                    ),
                  ),
                  takeUntilDestroyed(this.destroyRef),
                );
            }),
            filterOutNullish(),
            map((res) => res.ruleTableRow),
            tap((newRow) => {
              const { voting_weight, ...rest } = newRow;
              return this.store.dispatch(
                V2RulesTableActions.addRowToCurrentTable({ newRow: rest, isUserAction: true }),
              );
            }),
            switchMap((editedRow) =>
              this.store.select(selectCurrentV2RulesShouldGoToTheFirstPageOnSort).pipe(
                filterOutNullish(),
                take(1),
                map((shouldGoToTheFirstPageOnSort) => {
                  const { voting_weight, ...rest } = editedRow;
                  return { rest, shouldGoToTheFirstPageOnSort };
                }),
                takeUntilDestroyed(this.destroyRef),
              ),
            ),
            switchMap(({ shouldGoToTheFirstPageOnSort }) => {
              if (!ids || !ids.dataSetId || !ids.ruleSetId) return of({ shouldGoToTheFirstPageOnSort });

              return this.commentsService
                .updateComment(ids.dataSetId, ids.ruleSetId, {
                  comments: [],
                })
                .pipe(
                  tap(() => this.loadComments()),
                  map(() => ({ shouldGoToTheFirstPageOnSort })),
                  takeUntilDestroyed(this.destroyRef),
                );
            }),
            takeUntilDestroyed(this.destroyRef),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ shouldGoToTheFirstPageOnSort }) => {
        if (shouldGoToTheFirstPageOnSort) {
          setTimeout(() => this.dataGrid.instance.pageIndex(0));
        }

        this.notifyService.showNotify(
          this.translate.instant('project.rules.not_covered_rules.edit_success'),
          'success',
        );
      });
  }

  public onDelete(rule: any): void {
    this.ids$
      .pipe(
        take(1),
        filterOutNullish(),
        switchMap((ids) => {
          if (!ids?.dataSetId || !ids?.ruleSetId) return of(null);
          return this.commentsService.getComments(ids.dataSetId, ids.ruleSetId).pipe(
            map((response: any) => response?.comments ?? []),
            map((comments) => {
              return comments.map((comment: any) => ({
                ...comment,
                context: (comment.context || []).filter((c: any) => c.uuid !== rule.uuid),
              }));
            }),
            switchMap((updatedComments) => {
              if (!ids?.dataSetId || !ids?.ruleSetId) return of(null);
              return this.commentsService.updateComment(ids.dataSetId, ids.ruleSetId, {
                comments: updatedComments,
              });
            }),
            tap((comments) => {
              if (comments?.comments?.length === 0) {
                this.commentsSubject.next([]);
              } else {
                this.loadComments();
              }
            }),
          );
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.notifyService.showNotify(
          this.translate.instant('project.rules.not_covered_rules.remove_rules'),
          'success',
        );
      });
  }

  public loadComments(): void {
    this.ids$
      .pipe(
        take(1),
        switchMap((ids) => {
          if (!ids?.dataSetId || !ids?.ruleSetId) return of([]);
          return this.commentsService.getComments(ids.dataSetId, ids.ruleSetId);
        }),
        map((response: any) => {
          const comments = response?.comments ?? [];
          return comments.flatMap((comment: { context: any }) => comment.context || []);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((flattenedComments) => {
        this.commentsSubject.next(flattenedComments);
      });
  }
}
