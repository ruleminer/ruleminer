import { Injectable, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Event, NavigationEnd, Router } from '@angular/router';

import { filter } from 'rxjs/operators';
import { ModalService } from './modal/modal.service';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);
  private history = signal<string[]>([]);
  private modalService = inject(ModalService);
  private navEnd = toSignal(this.router.events.pipe(filter((e: Event) => e instanceof NavigationEnd)), {
    initialValue: null,
  });
  private isNavigatingBack = signal(false);

  constructor() {
    effect(
      () => {
        const navigationEnd = this.navEnd();
        if (navigationEnd instanceof NavigationEnd) {
          if (!this.isNavigatingBack()) {
            this.modalService.closeAll();
          }
          
          this.history.update((h) => [...h, navigationEnd.urlAfterRedirects]);
          
          this.isNavigatingBack.set(false);
        }
      },
      { allowSignalWrites: true },
    );
  }

  public back(): void {
    this.isNavigatingBack.set(true);
    
    const newHistory = [...this.history()];
    newHistory.pop();
    this.history.set(newHistory);
    
    const targetUrl = newHistory.length > 0 ? newHistory[newHistory.length - 1] : '/';
    
    this.router.navigateByUrl(targetUrl).then((success) => {
      if (success) {
        this.modalService.closeAll();
      } else {
        this.history.update((h) => [...h, this.router.url]);
        this.isNavigatingBack.set(false);
      }
    });
  }
}
