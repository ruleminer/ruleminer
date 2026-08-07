import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subject, take, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { environment } from 'projects/rolap/src/environments/environment';

import { AppState, Sidebar } from '../../store/app-state.model';
import { setSidebarVisibility, setSidebarWidth } from '../../store/sidebar/sidebar.action';
import { sidebarPreviousWidthSelector, sidebarWidthSelector } from '../../store/sidebar/sidebar.reducer';

@Component({
  selector: 'rolap-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() projectId: number;

  private onResizeBound: any;
  private stopResizeBound: any;

  public allowResize: boolean = environment.allowSidebarLeftResize;
  public minWidth = environment.minimalSidebarWidth;
  public isSidebarVisible = true;
  public isReachedLimit = false;

  private sidebarWidthSelector = this.store.select(sidebarWidthSelector);
  private sidebarPreviousWidthSelector = this.store.select(sidebarPreviousWidthSelector);
  private ngUnsubscribe = new Subject<void>();
  private datasetAmount: number;
  public sidebar: Sidebar = {
    width: environment.sidebarWidth,
    previous: 25,
    isVisible: false,
  };

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.sidebarWidthSelector.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.sidebar.width = res;
      if (this.sidebar.width == 0) {
        this.store.dispatch(
          setSidebarWidth({
            width: environment.sidebarWidth,
            previous: environment.closedSidebarWidth,
          }),
        );
        this.store.dispatch(setSidebarVisibility(true));
      } else if (this.sidebar.width == environment.closedSidebarWidth) {
        this.isSidebarVisible = false;
        this.store.dispatch(setSidebarVisibility(false));
      } else {
        this.isSidebarVisible = true;
        this.store.dispatch(setSidebarVisibility(true));
      }
    });

    this.sidebarPreviousWidthSelector.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.sidebar.previous = res;
    });

    this.checkWindowWidth();
    this.observeWindowWidth();
  }

  ngOnDestroy(): void {
    this.store.dispatch(setSidebarVisibility(false));
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private hideSidebar() {
    this.store.dispatch(setSidebarVisibility(false));
    this.store.dispatch(
      setSidebarWidth({
        width: environment.closedSidebarWidth,
        previous: this.sidebar.width,
      }),
    );
  }

  private showSidebar() {
    this.store.dispatch(setSidebarVisibility(true));
    if (this.sidebar.previous == environment.closedSidebarWidth) {
      this.sidebar.previous = environment.sidebarWidth;
    }
    this.store.dispatch(
      setSidebarWidth({
        width: this.sidebar.previous,
        previous: this.sidebar.width,
      }),
    );
  }

  public toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.isSidebarVisible ? this.showSidebar() : this.hideSidebar();
  }

  /**
   * Mouse click handler in resize area.
   *
   * @param event - mouse click event
   */
  public onMouseDown(event: MouseEvent) {
    if (event.buttons === 1) {
      // left mouse button
      event.preventDefault();

      if (!this.onResizeBound) {
        this.onResizeBound = this.resize.bind(this);
      }

      if (!this.stopResizeBound) {
        this.stopResizeBound = this.stopResize.bind(this);
      }

      window.addEventListener('mousemove', this.onResizeBound);
      window.addEventListener('mouseup', this.stopResizeBound);
    }
  }

  /**
   * Changing the width of a component.
   *
   * @param event - mouse move event
   */
  private resize(event: MouseEvent) {
    const maxSidebarWidth = (environment.maximumSidebarWidth / 100) * window.innerWidth; // percentage of window width

    if (event.pageX < this.minWidth || event.pageX >= maxSidebarWidth) {
      return;
    }

    this.store.dispatch(
      setSidebarWidth({
        width: event.pageX,
        previous: environment.closedSidebarWidth,
      }),
    );
  }

  /**
   * Clear eventListeners.
   */
  private stopResize() {
    window.removeEventListener('mousemove', this.onResizeBound);
    window.removeEventListener('mouseup', this.stopResizeBound);
  }

  /**
   * Observing the change in window width
   */
  private observeWindowWidth() {
    window.addEventListener('resize', () => {
      this.checkWindowWidth();
    });
  }

  /**
   * Checking the width of the window and sidebar. If the sidebar is too wide, its width is reduced.
   */
  private checkWindowWidth() {
    const maxSidebarWidth = (environment.maximumSidebarWidth / 100) * window.innerWidth; // percentage of window width

    this.store
      .select(sidebarWidthSelector)
      .pipe(take(1))
      .subscribe((sidebarWidth) => {
        if (sidebarWidth > maxSidebarWidth) {
          this.store.dispatch(
            setSidebarWidth({
              width: maxSidebarWidth,
              previous: environment.closedSidebarWidth,
            }),
          );
        }
      });
  }
}
