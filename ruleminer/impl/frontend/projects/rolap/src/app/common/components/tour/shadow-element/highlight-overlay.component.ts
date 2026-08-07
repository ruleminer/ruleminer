import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, Renderer2, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { catchError, firstValueFrom, of, timeout } from 'rxjs';

import { Store } from '@ngrx/store';

import { waitForElement } from '../utils';
import { HighlightOverlayService } from './highlight-overlay.service';

@Component({
  selector: 'rolap-highlight-overlay',
  standalone: true,
  imports: [CommonModule],
  template: ` <div #overlayDiv class="highlight-overlay"></div>`,
  styleUrls: ['./highlight-overlay.component.scss'],
})
export class HighlightOverlayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('overlayDiv', { static: true }) overlayRef!: ElementRef<HTMLElement>;
  private renderer = inject(Renderer2);
  private zone = inject(NgZone);
  private store = inject(Store);
  private highlightService = inject(HighlightOverlayService);
  private targetElement: HTMLElement | null = null;
  private eventListeners: (() => void)[] = [];
  private eventListenersAdded = false;
  private retryCount = 0;
  private maxRetries = 5;

  constructor() {
    this.highlightService.elementToHighlight$.pipe(takeUntilDestroyed()).subscribe((element) => {
      this.highlightElement(element);
    });
  }

  ngAfterViewInit(): void {
    // Initialize overlay styles after view is ready
    if (this.overlayRef?.nativeElement) {
      this.renderer.setStyle(this.overlayRef.nativeElement, 'display', 'none');
      this.renderer.setStyle(this.overlayRef.nativeElement, 'position', 'fixed');
      this.renderer.setStyle(this.overlayRef.nativeElement, 'z-index', '10101');
      this.renderer.setStyle(this.overlayRef.nativeElement, 'pointer-events', 'none');
    }
  }

  ngOnDestroy(): void {
    try {
      this.removeEventListeners();
      // Clear any pending timeouts or animation frames
      this.targetElement = null;
      this.retryCount = 0;
    } catch (error) {
      console.error('Error during component cleanup:', error);
    }
  }

  public async highlightElement(element: HTMLElement): Promise<void> {
    try {
      if (!element) {
        return;
      }

      // Wait for overlay to be ready
      if (!this.overlayRef?.nativeElement) {
        // Check retry count to prevent infinite loops
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => this.highlightElement(element), 100);
          return;
        }
      }

      // Reset retry count on successful overlay access
      this.retryCount = 0;

      const visibleElement = await this.findVisibleElement(element);
      if (!visibleElement) {
        return;
      }

      this.targetElement = visibleElement;

      // Reset and prepare overlay
      this.renderer.setStyle(this.overlayRef.nativeElement, 'display', 'block');
      this.renderer.setStyle(this.overlayRef.nativeElement, 'position', 'fixed');
      this.renderer.setStyle(this.overlayRef.nativeElement, 'z-index', '10101');
      this.renderer.setStyle(this.targetElement, 'pointer-events', 'auto');

      // Wait for DOM to be fully rendered
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Multiple position updates with different timing strategies
      this.updateOverlayPosition();

      requestAnimationFrame(() => {
        this.updateOverlayPosition();
      });

      setTimeout(() => {
        this.updateOverlayPosition();
      }, 50);

      setTimeout(() => {
        this.updateOverlayPosition();
      }, 200);

      if (!this.eventListenersAdded) {
        setTimeout(() => {
          if (this.targetElement && document.body.contains(this.targetElement)) {
            visibleElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            setTimeout(() => {
              this.updateOverlayPosition();
            }, 300);
          }
        }, 100);
      }

      if (!this.eventListenersAdded) {
        this.addEventListeners();
        this.eventListenersAdded = true;
      }
    } catch (error) {
      console.error('Error in highlightElement:', error);
    }
  }

  private async findVisibleElement(element: HTMLElement): Promise<HTMLElement | null> {
    let visibleElement = element;
    const isVisible = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        window.getComputedStyle(el).display !== 'none' &&
        window.getComputedStyle(el).visibility !== 'hidden' &&
        window.getComputedStyle(el).opacity !== '0'
      );
    };

    // Check if element is in DOM and visible
    if (!document.body.contains(element) || !isVisible(element)) {
      try {
        const selector = element.id ? `#${element.id}` : undefined;
        if (selector) {
          let found = document.querySelector(selector) as HTMLElement | null;

          if (!found) {
            const modalContainers = Array.from(
              document.querySelectorAll('.cdk-overlay-pane, common-modal, [role="dialog"], .modal, .ng-modal'),
            );
            for (const container of modalContainers) {
              found = container.querySelector(selector) as HTMLElement | null;
              if (found && isVisible(found)) break;
            }
          }

          // If still not found, use the waitForElement with timeout
          if (!found) {
            const waitResult = await firstValueFrom(
              waitForElement(selector).pipe(
                timeout(1000), // Reduced timeout to fail faster
                catchError(() => of(null)),
              ),
            );
            found = waitResult instanceof HTMLElement ? waitResult : null;
          }

          if (found && isVisible(found)) {
            visibleElement = found;
          } else {
            return null;
          }
        } else {
          return null;
        }
      } catch (e) {
        return null;
      }
      if (!visibleElement || !isVisible(visibleElement)) return null;
    }

    return visibleElement;
  }

  private updateOverlayPosition(): void {
    try {
      if (!this.overlayRef?.nativeElement || !this.targetElement) return;

      const overlay = this.overlayRef.nativeElement;

      // Ensure we have a valid target element that's still in the DOM
      if (!document.body.contains(this.targetElement)) {
        this.renderer.setStyle(overlay, 'display', 'none');
        return;
      }

      const rect = this.targetElement.getBoundingClientRect();

      // Validate that we have valid dimensions
      if (rect.width <= 0 || rect.height <= 0) {
        console.warn('Target element has invalid dimensions');
        // Hide overlay and dispatch element not found after a few retries
        this.renderer.setStyle(overlay, 'display', 'none');
        setTimeout(() => {
          if (this.targetElement && document.body.contains(this.targetElement)) {
            const newRect = this.targetElement.getBoundingClientRect();
            if (newRect.width <= 0 || newRect.height <= 0) {
            } else {
              this.updateOverlayPosition();
            }
          }
        }, 100);
        return;
      }

      // Use fixed positioning with viewport coordinates
      this.renderer.setStyle(overlay, 'position', 'fixed');
      this.renderer.setStyle(overlay, 'top', `${Math.round(rect.top)}px`);
      this.renderer.setStyle(overlay, 'left', `${Math.round(rect.left)}px`);
      this.renderer.setStyle(overlay, 'width', `${Math.round(rect.width)}px`);
      this.renderer.setStyle(overlay, 'height', `${Math.round(rect.height)}px`);
      this.renderer.setStyle(overlay, 'z-index', '10101');

      // Force hardware acceleration
      this.renderer.setStyle(overlay, 'transform', 'translate3d(0, 0, 0)');
      this.renderer.setStyle(overlay, 'backface-visibility', 'hidden');

      // Ensure visibility
      this.renderer.setStyle(overlay, 'display', 'block');
      this.renderer.setStyle(overlay, 'opacity', '1');
      this.renderer.setStyle(overlay, 'pointer-events', 'none');
    } catch (error) {
      console.error('Error updating overlay position:', error);
      // Hide overlay and dispatch element not found on error
      if (this.overlayRef?.nativeElement) {
        this.renderer.setStyle(this.overlayRef.nativeElement, 'display', 'none');
      }
    }
  }

  private removeEventListeners(): void {
    try {
      this.eventListeners.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error removing event listener:', error);
        }
      });
      this.eventListeners = [];
      this.eventListenersAdded = false;
    } catch (error) {
      console.error('Error in removeEventListeners:', error);
      // Force cleanup
      this.eventListeners = [];
      this.eventListenersAdded = false;
    }
  }

  private addEventListeners(): void {
    this.zone.runOutsideAngular(() => {
      // Window listeners
      this.eventListeners.push(
        this.renderer.listen(window, 'resize', () => {
          this.updateOverlayPosition();
        }),
      );

      this.eventListeners.push(
        this.renderer.listen(window, 'scroll', () => {
          this.updateOverlayPosition();
        }),
      );

      // Modal container listeners (if target is in modal)
      if (this.targetElement) {
        const modalContainer = this.targetElement.closest('.cdk-overlay-pane, common-modal, [role="dialog"]');
        if (modalContainer) {
          this.eventListeners.push(
            this.renderer.listen(modalContainer, 'scroll', () => {
              this.updateOverlayPosition();
            }),
          );
        }
      }
    });
  }
}
