import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { combineLatest, distinctUntilChanged, map } from 'rxjs';

import { Store } from '@ngrx/store';
import { environment } from 'projects/rolap/src/environments/environment';

import { ModalService } from '../../services/modal/modal.service';
import { AppState } from '../../store/app-state.model';
import { sidebarVisibilitySelector, sidebarWidthSelector } from '../../store/sidebar/sidebar.reducer';
import { LogoComponent } from '../icons/logo/logo.component';
import { UserInfoModule } from '../user-info/user-info.module';

type navigationColors = { bg: string; logo: string; border: string };

@Component({
  selector: 'rolap-appbar',
  templateUrl: './appbar.component.html',
  styleUrls: ['./appbar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent, UserInfoModule],
})
export class AppbarComponent {
  private readonly DEFAULT_COLORS: navigationColors = { bg: '#F0F2F4', logo: '#435272', border: '#DBE2EB' };
  private readonly PROJECTS_COLORS: navigationColors = { bg: '#131720', logo: '#B9BEC4', border: '#22293A' };
  public logoBreakPoint = environment.logoBreakPoint;

  private store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);
  private router = inject(Router);

  public sidebarState$ = combineLatest([
    this.store.select(sidebarVisibilitySelector),
    this.store.select(sidebarWidthSelector).pipe(distinctUntilChanged()),
  ]).pipe(
    map((data) => this.mapSidebarState(data)),
    distinctUntilChanged(),
  );


  public mapSidebarState([isVisible, sidebarWidth]: [boolean, number]) {
    const colors = isVisible ? this.PROJECTS_COLORS : this.DEFAULT_COLORS;
    const logoContainerWidth = isVisible ? sidebarWidth : environment.sidebarWidth;
    return { colors, logoContainerWidth };
  }
}
