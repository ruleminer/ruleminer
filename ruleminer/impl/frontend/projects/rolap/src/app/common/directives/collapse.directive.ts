import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, HostBinding, Input } from '@angular/core';

/**
 * Collapsible elements directive
 *
 * @export
 * @class CollapseDirective
 *
 * @example
 * <button (click)="isVisible = !isVisible">Toogle collapsible</button>
 * <div [rolapCollapse]="isVisible">
 *    Content to collapse
 * </div>
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[rolapCollapse]',
  template: '<ng-content></ng-content>',
  standalone: true,
  animations: [
    trigger('rolapCollapse', [
      state('0', style({ height: '0', opacity: '0', display: 'none', overflow: 'visible' })),
      state('1', style({ height: '*', opacity: '1', overflow: 'hidden' })),
      transition('0 <=> 1', animate('{{duration}}ms {{easing}}'), {
        params: {
          duration: 300,
          easing: 'ease-in',
        },
      }),
    ]),
  ],
})

// eslint-disable-next-line @angular-eslint/component-class-suffix
export class CollapseDirective {
  @HostBinding('@rolapCollapse')
  @Input()
  rolapCollapse: boolean;
}
