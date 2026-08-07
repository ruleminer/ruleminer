import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[rolap-text-btn]',
})
export class TextBtnDirective {
  @HostBinding('class') get classes(): string {
    return 'btn btn--text';
  }
}
