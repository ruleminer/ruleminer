import { Observable } from 'rxjs';

import { CurrentPosition } from '../../store/tour/types';
import { TourStep } from './types';

export function getPositionStyle(step: TourStep, rect: DOMRect): CurrentPosition {
  const tooltipOffset = 10;
  const tooltipEstimatedHeight = 220;
  const tooltipEstimatedWidth = 420;
  const edgeMargin = 20;

  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const elementCenterY = rect.top + rect.height / 2;
  const elementCenterX = rect.left + rect.width / 2;

  if (elementCenterY < 0 || elementCenterY > viewportHeight || elementCenterX < 0 || elementCenterX > viewportWidth) {
    const element = document.elementFromPoint(elementCenterX, elementCenterY);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }

  let top = rect.bottom + window.scrollY + tooltipOffset;
  let left = rect.left + window.scrollX;
  let isAbove = false;

  const tooltipBottomEdge = top + tooltipEstimatedHeight;

  if (tooltipBottomEdge > window.scrollY + viewportHeight) {
    top = rect.top + window.scrollY - tooltipEstimatedHeight - tooltipOffset; // Reduced by 20px when above
    isAbove = true;

    if (top < window.scrollY) {
      top = window.scrollY + viewportHeight - tooltipEstimatedHeight - edgeMargin;
      isAbove = false;
    }
  }

  const tooltipRightEdge = left + tooltipEstimatedWidth;

  if (tooltipRightEdge > window.scrollX + viewportWidth) {
    left = window.scrollX + viewportWidth - tooltipEstimatedWidth - edgeMargin;
  }

  if (left < window.scrollX) {
    left = window.scrollX + edgeMargin;
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    isAbove,
  };
}

export function getCurrentStepPosition(stepIndex: number, steps: TourStep[]) {
  if (!steps) return { top: '50%', left: '50%' };
  const step = steps[stepIndex];

  if (!step || !step.element) {
    return { top: '50%', left: '50%' };
  }
  const element = document.querySelector(step.element);

  if (!element) {
    return { top: '50%', left: '50%' };
  }

  const rect = element.getBoundingClientRect();
  return getPositionStyle(step, rect);
}

export function waitForElement(selector: string): Observable<HTMLElement> {
  return new Observable((observer) => {
    // Helper function to check if element is visible on screen
    const isVisibleOnScreen = (element: Element): boolean => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const isVisibleVertically =
        rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
      const isVisibleHorizontally =
        rect.left < (window.innerWidth || document.documentElement.clientWidth) && rect.right > 0;
      return isVisibleVertically && isVisibleHorizontally;
    };

    // Check if element already exists and is visible
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element && element instanceof HTMLElement) {
        if (!isVisibleOnScreen(element)) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });

          // Wait for scrolling to complete and element to be fully rendered
          setTimeout(() => {
            // Double-check visibility after scroll
            if (isVisibleOnScreen(element)) {
              observer.next(element);
              observer.complete();
              if (mutationObserver) mutationObserver.disconnect();
            } else {
              // If still not visible, try one more time with additional delay
              setTimeout(() => {
                if (isVisibleOnScreen(element)) {
                  observer.next(element);
                  observer.complete();
                  if (mutationObserver) mutationObserver.disconnect();
                }
              }, 200);
            }
          }, 400);
          return false;
        } else {
          observer.next(element);
          observer.complete();
          if (mutationObserver) mutationObserver.disconnect();
          return true;
        }
      }
      return false;
    };

    // Return immediately if element already exists and is visible
    if (checkElement()) return;

    // Set up mutation observer to watch for DOM changes
    const observerConfig = { childList: true, subtree: true, attributes: true };
    const mutationObserver = new MutationObserver(() => {
      checkElement();
    });

    mutationObserver.observe(document.body, observerConfig);

    return () => mutationObserver.disconnect();
  });
}

export function findElementWithRetries(selector: string, maxRetries: number): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    let attempts = 0;

    const tryFind = () => {
      attempts++;

      let element = document.querySelector(selector) as HTMLElement | null;

      if (!element) {
        const modalContainers = Array.from(
          document.querySelectorAll('.cdk-overlay-pane, common-modal, [role="dialog"], .modal, .ng-modal'),
        );
        for (const container of modalContainers) {
          element = container.querySelector(selector) as HTMLElement | null;
          if (element) break;
        }
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          window.getComputedStyle(element).display !== 'none' &&
          window.getComputedStyle(element).visibility !== 'hidden';

        if (isVisible) {
          resolve(element);
          return;
        }
      }

      if (attempts < maxRetries) {
        setTimeout(tryFind, 300 * attempts);
      } else {
        resolve(null);
      }
    };

    tryFind();
  });
}
