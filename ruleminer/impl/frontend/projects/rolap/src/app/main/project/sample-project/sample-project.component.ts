import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { Subject, map, startWith, switchMap, take, takeUntil } from 'rxjs';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faChartScatter, faDiagramProject, faLineChart } from '@fortawesome/pro-regular-svg-icons';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { ProblemTypes } from '../../data-upload/utils/enums';
import { ProjectService } from '../service/project.service';

@Component({
  selector: 'rolap-sample-project',
  templateUrl: './sample-project.component.html',
  styleUrls: ['./sample-project.component.scss'],
})
export class SampleProjectComponent implements OnChanges, OnDestroy {
  @Input() problemType: ProblemTypes;
  @Input() isProjectLimitReached: boolean;
  public currentLanguage$ = this.translate.onLangChange.pipe(
    map((event: LangChangeEvent) => event.lang),
    startWith(this.translate.currentLang),
  );
  private ngUnsubscribe: Subject<void> = new Subject();

  public projectIcon: IconDefinition;
  public projectId: string;

  constructor(private projectService: ProjectService, private router: Router, private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['problemType']) {
      this.setUIIcon();
      this.projectId = this.generateProjectId();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public createSampleProject() {
    this.currentLanguage$
      .pipe(
        take(1),
        switchMap((lang) => this.projectService.createExampleProject(this.problemType, lang)),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((res: { project_id: number }) => {
        this.router.navigate(['/projects', res.project_id]);
      });
  }

  private setUIIcon() {
    switch (this.problemType) {
      case ProblemTypes.Classification:
        this.projectIcon = faDiagramProject;
        break;
      case ProblemTypes.Regression:
        this.projectIcon = faChartScatter;
        break;
      case ProblemTypes.Survival:
        this.projectIcon = faLineChart;
        break;
    }
  }
  private generateProjectId(): string {
    return `project_${this.problemType}`;
  }
}
