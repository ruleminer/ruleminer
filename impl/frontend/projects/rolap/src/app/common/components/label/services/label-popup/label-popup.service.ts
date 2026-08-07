import { ComponentRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';

import { LabelPopupComponent } from '../../label-popup/label-popup.component';

interface Position {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root',
})
export class LabelPopupService {
  private renderer: Renderer2;
  private containerId = 'label-popup-container';
  private container: any;
  private prevScrollPosition: Position;
  private labelPopupPosition: Position;
  private labelPopupComponent: ComponentRef<LabelPopupComponent> | null;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.createLabelPopupContainer();
  }

  /**
   * Create a `div` element that is a container for the label popup.
   */
  public createLabelPopupContainer() {
    const isContainerExist = document.getElementById(this.containerId);

    if (isContainerExist) return;

    this.container = this.renderer.createElement('div');
    this.renderer.setProperty(this.container, 'id', this.containerId);
    this.renderer.appendChild(document.body, this.container);
  }

  /**
   * Dynamically create a label component.
   *
   * @param labelPopup - label popup component reference
   * @param posX       - X position of label popup
   * @param posY       - Y position of label popup
   */
  public showLabelPopup(labelPopup: ComponentRef<LabelPopupComponent>, posX: number, posY: number) {
    if (this.labelPopupComponent) {
      this.removePopup();
    }

    const newPosX = posX + document.documentElement.scrollLeft;
    const newPosY = posY + document.documentElement.scrollTop;

    this.renderer.setStyle(this.container, 'left', `${posX}px`);
    this.renderer.setStyle(this.container, 'top', `${posY}px`);
    this.renderer.appendChild(this.container, labelPopup.location.nativeElement);

    this.labelPopupComponent = labelPopup;
    this.savePositions(newPosX, newPosY, window.scrollX, window.screenY);
  }

  /**
   * Updates the popup position after changing the scroll value.
   *
   * @param posX - page scroll X value
   * @param posY - page scroll Y value
   */
  public updateLabelPopupPosition(posX: number, posY: number) {
    const scrollOffset: Position = { x: posX - this.prevScrollPosition.x, y: posY - this.prevScrollPosition.y };
    const currentPosX = this.labelPopupPosition.x - scrollOffset.x;
    const currentPosY = this.labelPopupPosition.y - scrollOffset.y;

    this.renderer.setStyle(this.container, 'left', `${currentPosX}px`);
    this.renderer.setStyle(this.container, 'top', `${currentPosY}px`);

    this.savePositions(posX, posY, currentPosX, currentPosY);
  }

  /**
   * Remove label popup.
   */
  public removePopup() {
    this.labelPopupComponent?.destroy();
    this.labelPopupComponent = null;
  }

  /**
   * Save position of label popup and previous value of sroll position.
   *
   * @param scrollPosX - horizontal scroll position
   * @param scrollPosY - vertical scroll position
   * @param popupPosX  - popup X position
   * @param popupPosY  - popup Y position
   */
  private savePositions(scrollPosX: number, scrollPosY: number, popupPosX: number, popupPosY: number) {
    this.prevScrollPosition = { x: scrollPosX, y: scrollPosY };
    this.labelPopupPosition = { x: popupPosX, y: popupPosY };
  }
}
