import { Injectable } from '@angular/core';

import notify from 'devextreme/ui/notify';
import { environment } from 'projects/rolap/src/environments/environment';

type NotifyType = 'error' | 'info' | 'success' | 'warning';
type Notification = {
  message: string;
  type: NotifyType;
  displayTime: number;
};

@Injectable({
  providedIn: 'root',
})
export class NotifyService {
  constructor() {}

  /**
   * Show notification that disapears after couple seconds.
   * Notifications are displayed in a stack.
   *
   * @param message - value to display in notification
   * @param type    - type determines color of notification
   * @param displayDuplicateMsg - if true, notification with the same message will be displayed
   * @param displayTime - time in milliseconds after which notification will disappear from screen (default is environment.notifyTime)
   */
  public showNotify(message: string, type: NotifyType, displayDuplicateMsg = false, displayTime?: number): void {
    const notification = this.createNotificationObject(message, type, displayTime);
    this.displayNotificationIfSameMsgIsNotDisplayed(notification, displayDuplicateMsg);
  }

  /**
   * Show notification stays on screen.
   * Notifications are displayed in a stack.
   *
   * @param message - value to display in notification
   * @param type    - type determines color of notification
   */
  public showPermanentNotify(message: string, type: NotifyType): void {
    const notification = this.createNotificationObject(message, type, 600000); // 10 minutes devextreme doesnt support permanent notifications
    this.displayNotificationIfSameMsgIsNotDisplayed(notification);
  }

  private displayNotificationIfSameMsgIsNotDisplayed(notification: Notification, displayDuplicateMsg = false): void {
    if (this.findSameNotify(notification.message) && !displayDuplicateMsg) return;
    notify(notification, { position: 'top center', direction: 'down-push' });
  }

  /**
   * Checking whether a notification with the same content is already displayed on the screen.
   *
   * @param message - value to display in notification
   */
  private findSameNotify(message: string): boolean {
    const notifyContainer = document.querySelector('.dx-toast-stack');

    if (!notifyContainer) return false;

    const notifyElements = Array.from(notifyContainer.querySelectorAll('.dx-toast-message'));
    const notifyMessages = notifyElements.map((x) => x.textContent);

    if (notifyMessages.indexOf(message) > -1) return true;
    return false;
  }

  private createNotificationObject(
    message: string,
    type: NotifyType,
    displayTime = environment.notifyTime,
  ): Notification {
    return {
      message,
      type,
      displayTime,
    };
  }
}
