import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DxButtonModule } from 'devextreme-angular';
import { DxTemplateModule } from 'devextreme-angular/core';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';

import { ActionItem } from '../../models/action-item.model';
import { ICONS_ACTION_SERVICE_TOKEN, iconsActionServiceProvider } from '../../services/icons-action.provider';
import { TabActionCalledBy } from '../../services/base-icons-action.service';

@Component({
  selector: 'rolap-icons-action-bar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, DxTooltipModule, DxTemplateModule, DxButtonModule, TranslateModule],
  templateUrl: './icons-action-bar.component.html',
  styleUrls: ['./icons-action-bar.component.scss'],
  providers: [iconsActionServiceProvider],
})
export class IconsActionBarComponent {
  private iconsActionService = inject(ICONS_ACTION_SERVICE_TOKEN);
  public actions$: Observable<ActionItem[]> = this.iconsActionService.currentIconActions$;

  public executeAction(action: ActionItem['action']): void {
    this.iconsActionService.calledBy = TabActionCalledBy.ToolBar;
    if (!action) throw Error('undefined action');
    action();
  }
}
