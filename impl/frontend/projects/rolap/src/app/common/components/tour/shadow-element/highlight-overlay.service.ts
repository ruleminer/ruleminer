import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { filterOutNullish } from '../../../utils/rxjsUtils';
import { combineLatestWith, filter, of, switchMap } from 'rxjs';

import { Store } from '@ngrx/store';

import { AppState } from '../../../store/app-state.model';
import { selectCurrentStepIndex, selectIsStepReady } from '../../../store/tour/tour.selectors';
import { tourSteps } from '../tour-steps';
import { findElementWithRetries } from '../utils';
import { HighlightOverlayComponent } from './highlight-overlay.component';

@Injectable({
  providedIn: 'root',
})
export class HighlightOverlayService implements OnDestroy {
  private overlayRef?: OverlayRef;
  private overlay = inject(Overlay);
  private router = inject(Router);
  private store = inject(Store<AppState>);
  private overlayComponentRef?: ComponentRef<HighlightOverlayComponent>;

  public steps = tourSteps(this.router);
  public elementToHighlight$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    switchMap(() => this.store.select(selectIsStepReady)),
    combineLatestWith(this.store.select(selectCurrentStepIndex).pipe(filterOutNullish())),
    switchMap(([isStepReady, currentStepIndex]) => {
      if (!isStepReady || currentStepIndex === undefined) return of(null);
      if (currentStepIndex >= this.steps.length) return of(null);

      const currentStep = this.steps[currentStepIndex];

      // Try to find element with retry logic
      return findElementWithRetries(currentStep.element, 3);
    }),
    filterOutNullish(),
  );

  constructor() {}

  ngOnDestroy(): void {
    this.closeOverlay();
  }

  public highlightElement(element: HTMLElement): void {
    if (this.overlayRef && this.overlayComponentRef) {
      // Wait for the component to be fully initialized
      setTimeout(() => {
        this.overlayComponentRef!.instance.highlightElement(element);
      }, 0);
      return;
    }

    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      panelClass: 'tour-highlight-overlay-panel',
      positionStrategy: this.overlay.position().global().left('0px').top('0px'),
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      width: '100vw',
      height: '100vh',
    });

    const portal = new ComponentPortal(HighlightOverlayComponent);
    const overlayComponent = this.overlayRef.attach(portal);
    this.overlayComponentRef = overlayComponent;

    setTimeout(() => {
      overlayComponent.instance.highlightElement(element);
    }, 50);
  }

  public closeOverlay(): void {
    try {
      if (this.overlayComponentRef) {
        this.overlayComponentRef.destroy();
        this.overlayComponentRef = undefined;
      }

      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = undefined;
      }
    } catch (error) {
      this.overlayComponentRef = undefined;
      this.overlayRef = undefined;
    }
  }
}
