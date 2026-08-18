import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { ItemClickEvent } from 'devextreme/ui/context_menu';

import { ContextMenuItem } from '../../../interfaces/context-menu.model';
import { Ids } from '../../../store/ruleSets/rulesets.selectors';
import { Label } from '../interfaces/label.model';
import { LabelPopupComponent } from '../label-popup/label-popup.component';
import { LabelPopupService } from '../services/label-popup/label-popup.service';

@Component({
  selector: 'rolap-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
})
export class LabelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() id: number;
  @Input() text: string;
  @Input() color: string;
  @Input() selected?: boolean;
  @Input() preview?: boolean;
  @Input() contextMenu?: boolean;
  @Input() ids?: Ids;
  @Input() uuid?: string;
  @Input() readonly = false;
  @Input() compact: boolean;
  @Output() labelClick = new EventEmitter<number>();
  @Output() removeLabel = new EventEmitter<Label>();
  @Output() editLabel = new EventEmitter<Label>();

  public textColor = '#ffffff';
  public contextMenuItems: ContextMenuItem[];

  private offsetX: number = 10;
  private offsetY: number = -15;
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(
    private labelPopupService: LabelPopupService,
    private vcRef: ViewContainerRef,
    private elementRef: ElementRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    if (this.readonly) this.contextMenu = false;

    if (this.contextMenu) this.contextMenuInit();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // setting the text color depending on the background color
    if (changes['color']?.currentValue) {
      this.textColor = this.pickTextColorBasedOnBgColor(this.color, '#ffffff', '#000000');
    }
  }

  public onLabelClick(id: number) {
    if (this.readonly) return;

    if (this.preview) {
      this.labelClick.emit(id);
    } else {
      const labelPopupComponentRef = this.vcRef.createComponent(LabelPopupComponent);
      labelPopupComponentRef.instance.labelPopupType = 'edit';
      labelPopupComponentRef.instance.labelToEdit = { id: this.id, name: this.text, color: this.color };
      labelPopupComponentRef.instance.uuid = this.uuid!;
      labelPopupComponentRef.instance.ids = this.ids!;

      const labelRectData = this.elementRef.nativeElement.getBoundingClientRect();
      const posX = labelRectData.right + this.offsetX;
      const posY = labelRectData.top + this.offsetY;

      this.labelPopupService.showLabelPopup(labelPopupComponentRef, posX, posY);
    }
  }

  public onContextMenuClick(event: ItemClickEvent) {
    const itemData = event.itemData as ContextMenuItem;
    const eventType = itemData.type;
    const label: Label = {
      id: this.id,
      name: this.text,
      color: this.color,
    };

    if (eventType === 'delete') {
      this.removeLabel.emit(label);
    } else {
      this.editLabel.emit(label);
    }
  }

  /**
   * Context menu data initialization
   */
  private contextMenuInit() {
    if (!this.contextMenu) {
      return;
    }

    this.translate
      .stream('labels.select_popup.context_menu')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.contextMenuItems = [
          { text: res.edit, type: 'edit' },
          { text: res.delete, type: 'delete' },
        ];
      });
  }

  /**
   * The function determines whether to use a light or dark text color for the given background color.
   *
   * @param bgColor    - background color
   * @param lightColor - light text color (for dark background)
   * @param darkColor  - dark text color (for light background)
   */
  private pickTextColorBasedOnBgColor(bgColor: string, lightColor: string, darkColor: string) {
    const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
      if (col <= 0.03928) {
        return col / 12.92;
      }
      return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.3 ? darkColor : lightColor;
  }
}
