import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TextBtnDirective } from '../../directives/buttons/text-btn.directive';
import { TitleComponent } from '../title/title.component';
import { CardFooterComponent } from './card-footer/card-footer.component';
import { CardComponent } from './card.component';

@NgModule({
  declarations: [CardComponent, CardFooterComponent, TextBtnDirective],
  imports: [CommonModule, TitleComponent],
  exports: [CardComponent, TitleComponent, CardFooterComponent, TextBtnDirective],
})
export class CardModule {}
