import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Modal } from '../../../../common/services/modal/modal';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../common/store/app-state.model';
import { TabsActions } from '../../../../common/store/ruleSets/tabs.action';
import { V2CurrentTabAction } from '../../../../common/store/v2CurrentTab/v2CurrentTab.action';

@Component({
  selector: 'rolap-process-tab-info',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
  ],
  template: `
    <div class="my2">
      <p *ngIf="contentTranslateKey">{{ contentTranslateKey | translate }}.</p>
      <p>
        {{ 'process.info_modal.content.follow_process' | translate }}:
        <button class="btn-link" data-cy="process-link" (click)="openProcessTab()">
          {{ 'process.tab_name' | translate }}
        </button>
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessTabInfoComponent {
  @Input({ required: true }) projectId!: number;
  @Input() contentTranslateKey?: string;

  private modal = inject(Modal<ProcessTabInfoComponent>);
  private store = inject(Store<AppState>);

  public openProcessTab() {
    this.modal.close();
    this.store.dispatch(TabsActions.addProcess());
    this.store.dispatch(V2CurrentTabAction.setCurrentTab({ currentTab: 'process' }))
  }
}