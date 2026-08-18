import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

import { ColoredCellColorsService } from './service/colored-cell-colors.service';

@Component({
  selector: 'rolap-colored-cell-based-on-id',
  templateUrl: './colored-cell-based-on-id.component.html',
  styleUrls: ['./colored-cell-based-on-id.component.scss'],
  standalone: true,
  providers: [ColoredCellColorsService],
  imports: [CommonModule, TranslateModule, FontAwesomeModule],
})
export class ColoredCellBasedOnIdComponent implements OnInit {
  @Input() key: number | any;
  @Input() text: string | any;
  @Input() height: number | string;
  /** Selector of the parent element. If provided, the color will
   be applied to all the parent elements up to the first element matching the selector. **/
  @Input() colorParentElementSelector: string | null;
  public backgroundColor: string;
  public whiteText: boolean;

  public faXmark = faXmark;

  constructor(private service: ColoredCellColorsService, private elementRef: ElementRef) {}

  ngOnInit(): void {
    if (this.key) {
      const colors = this.service.getColorsForId(this.key);
      this.backgroundColor = colors.backgroundColor;
      this.whiteText = colors.whiteText;

      if (this.colorParentElementSelector) {
        this.setColorToParentElement(this.elementRef.nativeElement?.parentElement);
      }
    }
  }

  public setColorToParentElement(parentElement: HTMLElement) {
    if (!parentElement || !parentElement.style) return;
    parentElement.style.backgroundColor = this.backgroundColor;
    if (!parentElement.matches(this.colorParentElementSelector!)) {
      // continue to find parent td element
      this.setColorToParentElement(parentElement.parentElement!);
    }
  }
}
