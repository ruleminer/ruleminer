import { Component, OnDestroy, OnInit } from '@angular/core';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { Subject, map, switchMap, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { AppState } from '../../../common/store/app-state.model';
import { V2Tab } from '../../../common/store/v2Tabs/types';
import { selectCurrentV2Tab } from '../../../common/store/v2Tabs/v2Tabs.selectors';
import { isLoadingCurrentV2Visualization } from '../../../common/store/v2VisualizationTab/v2VisualizationTab.selectors';
import { Project } from '../models/project';

@Component({
  selector: 'rolap-project-visualization',
  templateUrl: './project-visualization.component.html',
  styleUrls: ['./project-visualization.component.scss'],
})
export class ProjectVisualizationComponent implements OnInit, OnDestroy {
  public project: Project;
  public alignments: { icon: string; alignment: string; hint: any; text: any; index: number }[];
  private ngUnsubscribe = new Subject();
  public selectedAlignment: string;
  public v2Tab: V2Tab;
  public isLoading$ = this.store.select(isLoadingCurrentV2Visualization);

  constructor(private translateService: TranslateService, private store: Store<AppState>) {}

  ngOnInit(): void {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.updateAlignments();
    });
    this.store
      .select(selectCurrentV2Tab)
      .pipe(
        switchMap((v2Tab) => {
          return this.store
            .select((state) => state.project.activeProject)
            .pipe(
              filterOutNullish(),
              map((project: Project) => {
                return { project, v2Tab };
              }),
            );
        }),
        filterOutNullish(),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe(({ project, v2Tab }) => {
        if (!v2Tab) return;
        this.v2Tab = v2Tab;
        this.project = project;
      });

    this.updateAlignments();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.complete();
  }

  private updateAlignments(): void {
    this.alignments = [
      {
        icon: 'chart',
        alignment: 'left',
        hint: this.translateService.instant('project.visualization_tabs.rulset'),
        text: this.translateService.instant('project.visualization_tabs.rulset'),
        index: 0,
      },
      {
        icon: 'chart',
        alignment: 'center',
        hint: this.translateService.instant('project.visualization_tabs.importance'),
        text: this.translateService.instant('project.visualization_tabs.importance'),
        index: 1,
      },
      // DO NOT REMOVE! this tab must be temporarily hidden
      // {
      //   icon: 'chart',
      //   alignment: 'right',
      //   hint: this.translateService.instant('project.visualization_tabs.visualization'),
      //   text: this.translateService.instant('project.visualization_tabs.visualization'),
      // },
    ];

    this.selectedAlignment = this.alignments[0].alignment;
  }

  public selectChart(event: any): void {
    this.selectedAlignment = event.itemData.alignment;
  }
}
