import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subject, filter, switchMap, takeUntil } from 'rxjs';

import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ProjectService } from 'projects/rolap/src/app/main/project/service/project.service';

import { DownloadManager } from '../../../modules/helpers/download-manager';
import {
  GestureRecognitionResponse,
  GestureRecognizerHandler,
} from '../../../modules/visualisation/helpers/gesture-recognizer-handler';
import {
  SpeechRecognitionHandler,
  SpeechRecognitionResponse,
} from '../../../modules/visualisation/helpers/speech-recognition-handler';
import { Visualisation3DInterationHandlers } from '../../../modules/visualisation/helpers/visualisation-3d-interaction-handler';
import { Visualisation3DPlotter } from '../../../modules/visualisation/helpers/visualisation-3d-plotter';
import { ModalRef } from '../../../services/modal/modal-ref';
import { ModalService } from '../../../services/modal/modal.service';
import { AppState } from '../../../store/app-state.model';
import { sidebarWidthSelector } from '../../../store/sidebar/sidebar.reducer';
import { MetricsModalComponent } from '../metrics-modal/metrics-modal.component';

@Component({
  selector: 'rolap-cam-and-speech',
  templateUrl: './cam-and-speech.component.html',
  styleUrls: ['./cam-and-speech.component.scss'],
})
export class CamAndSpeechComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() datasetId: number | undefined;
  @Input() ruleSetId: number | undefined;
  @Input() projectId: number | undefined;

  public actionStatus = {
    'zoom-in': { enabled: true },
    'zoom-out': { enabled: true },
    x: { enabled: true },
    y: { enabled: true },
    z: { enabled: true },
    stop: { enabled: true },
    micro: { enabled: true },
    camera: { enabled: true },
  };
  private rulsetIndicatorsJSON: any;
  private rulsetJSON: any;
  public indicators: { name: string; enabled: boolean }[] = [];
  public selectedIndicators: string[] = [];
  public selectedIndicatorsText: string = '';

  private ngUnsubcribe: Subject<void> = new Subject();
  public interactionHandler: Visualisation3DInterationHandlers = new Visualisation3DInterationHandlers();
  private visualisation3DPlotter: Visualisation3DPlotter = new Visualisation3DPlotter('scatter');
  //#region Speech Recognition Handler
  private speechRecognitionHandler: SpeechRecognitionHandler = new SpeechRecognitionHandler(
    // onSpeechEnabled
    [
      () => {
        // handle stop webcam !!!
        this.actionStatus['micro'].enabled = false;
      },
    ],
    // onSpeechStopped
    [
      () => {
        this.actionStatus['micro'].enabled = true;
      },
    ],
    // onSpeechFeedback
    [
      (response: SpeechRecognitionResponse) => {
        if (
          response.action === 'z' &&
          this.interactionHandler.visualisation3DHandler.visualizationData.plotType === 'scatter'
        ) {
          this.speechOutput.label = response.action;
          this.speechOutput.score = response.confidence.toFixed(2) + '%';
          this.translate
            .get('visualisation.cannot_rotate_2d_around_z')
            .pipe(takeUntil(this.ngUnsubcribe))
            .subscribe((translation) => {
              this.speechOutput.message = translation;
            });
          this.interactionHandler.interval && this.interactionHandler.handleInteraction('stop');
        } else {
          this.speechOutput.label = response.action;
          this.speechOutput.score = response.confidence.toFixed(2) + '%';
          this.speechOutput.message = '';
          this.interactionHandler.handleInteraction(response.action);
          if (response.action === 'stop') {
            this.toggleSpeechRecognition();
          }
        }
      },
    ],
  );
  //#endregion
  private gestureRecognizer: GestureRecognizerHandler = new GestureRecognizerHandler(
    [
      () => {
        // handle stop webcam !!!
        this.actionStatus['camera'].enabled = false;
      },
    ],
    [
      () => {
        this.actionStatus['camera'].enabled = true;
      },
    ],
    [
      (response: GestureRecognitionResponse) => {
        if (
          response.categoryName === 'z' &&
          this.interactionHandler.visualisation3DHandler.visualizationData.plotType === 'scatter'
        ) {
          this.gestureOutput.label = response.categoryName;
          this.gestureOutput.score = response.categoryScore.toFixed(2);

          this.translate
            .get('visualisation.cannot_rotate_2d_around_z')
            .pipe(takeUntil(this.ngUnsubcribe))
            .subscribe((translation) => {
              this.gestureOutput.message = translation;
            });
          // this.gestureOutput.message = "Nie można obrócić wykresu 2D wokół osi Z";
          this.interactionHandler.interval && this.interactionHandler.handleInteraction('stop');
        } else {
          this.gestureOutput.label = response.categoryName;
          if (!!response.categoryScore) {
            this.gestureOutput.score = response.categoryScore.toFixed(2) + '%';
          }

          this.gestureOutput.message = '';
          this.interactionHandler.handleInteraction(response.categoryName);
        }
      },
    ],
  );
  public gestureOutput: {
    label: string;
    score: string;
    message: string;
  } = { label: '', score: '', message: '' };
  public speechOutput: {
    label: string;
    score: string;
    message: string;
  } = { label: '', score: '', message: '' };

  private downloadManager: DownloadManager = new DownloadManager(() => {
    this.initPlot();
  });
  private sidebarWidthSelector = this.store.select(sidebarWidthSelector);

  constructor(
    private projectService: ProjectService,
    private translate: TranslateService,
    private modalService: ModalService,
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.getData();
    this.speechRecognitionHandler.init();

    this.sidebarWidthSelector.pipe(takeUntil(this.ngUnsubcribe)).subscribe(() => {
      this.redrawPlot();
    }),
      window.addEventListener('resize', this.redrawPlot.bind(this));
  }

  ngAfterViewInit(): void {
    this.gestureRecognizer.init();
    this.interactionHandler.visualisation3DHandler.visualizationData.chart = document.getElementById('plot');
  }

  ngOnDestroy(): void {
    this.ngUnsubcribe.next();
    this.ngUnsubcribe.complete();
    window.removeEventListener('resize', this.redrawPlot.bind(this));
  }

  public openMetricSelectionModal(): void {
    const modal = this.modalService.open(MetricsModalComponent, 'visualisation.indicators', '80vh', '50vw', {
      metrics: this.indicators,
      maxSelectionCount: 3,
    });

    modal
      .pipe(
        switchMap((modalRef: ModalRef<MetricsModalComponent>) =>
          modalRef.getResult().pipe(filter((res) => res !== undefined)),
        ),
        takeUntil(this.ngUnsubcribe),
      )
      .subscribe((indicators: any) => {
        this.selectedIndicators = indicators.map((indicator: any) => indicator.name);
        this.selectedIndicatorsText = this.selectedIndicators.join(', ');
        this.indicators.forEach((indicator) => {
          indicator.enabled = this.selectedIndicators.includes(indicator.name);
        });

        this.stopAndRemovePlot();
        this.drawPlot();
      });
  }

  public stopSpeechRecognition(): void {
    this.speechRecognitionHandler.stopSpeechRecognition();
  }

  public toggleSpeechRecognition(): void {
    this.speechRecognitionHandler.toggleSpeechRecognition();
  }

  public toggleGestureRecognition(): void {
    this.gestureRecognizer.toggleWebCam();
  }

  public indicatorSelectionChanged(event: any) {
    const selectedIndicator = event.itemData.name;
    if (selectedIndicator) {
      const foundIndicator = this.indicators.find((indicator) => indicator.name === selectedIndicator);
      if (!foundIndicator) return;

      if (foundIndicator.enabled) {
        this.selectedIndicators = this.selectedIndicators.filter((indicator) => indicator !== selectedIndicator);
        foundIndicator.enabled = false;
      } else if (!this.selectedIndicators.includes(selectedIndicator) && this.selectedIndicators.length < 3) {
        this.selectedIndicators.push(foundIndicator.name);
        foundIndicator.enabled = true;
      }
    }

    this.stopAndRemovePlot();
    this.drawPlot();
  }

  private redrawPlot(): void {
    this.stopAndRemovePlot(true);
    setTimeout(() => {
      this.drawPlot();
    }, 100);
  }

  //#region Draw Plot

  private stopAndRemovePlot(remove: boolean = false): void {
    // stop interval and speech recognition
    this.interactionHandler.interval && this.interactionHandler.handleInteraction('stop');
    this.stopSpeechRecognition();
    // stop webcam prediction
    this.gestureRecognizer.stopWebCam();
    if (remove) {
      (window as any).Plotly.purge(this.interactionHandler.visualisation3DHandler.visualizationData.chart);
      this.visualisation3DPlotter.plotExists = false;
    }
  }

  private drawPlot(): void {
    const number = this.selectedIndicators.length;
    switch (number) {
      case 1:
        this.stopAndRemovePlot(true);
        break;
      case 2:
        this.draw2DPlot();
        break;
      case 3:
        this.draw3DPlot();
        break;
      default:
        this.stopAndRemovePlot(true);
        break;
    }
  }

  private draw2DPlot(): void {
    this.interactionHandler.visualisation3DHandler.visualizationData.plotType = 'scatter';
    this.visualisation3DPlotter.updatePlotType(
      this.interactionHandler.visualisation3DHandler.visualizationData.plotType,
    );
    this.actionStatus['z'].enabled = false;

    this.interactionHandler.visualisation3DHandler.visualizationData.axisTitles = this.selectedIndicators;
    this.visualisation3DPlotter.plotRuleIndicators(this.selectedIndicators, this.rulsetIndicatorsJSON, this.rulsetJSON);
  }

  private draw3DPlot(): void {
    this.interactionHandler.visualisation3DHandler.visualizationData.plotType = 'scatter3d';
    this.visualisation3DPlotter.updatePlotType(
      this.interactionHandler.visualisation3DHandler.visualizationData.plotType,
    );
    this.actionStatus['z'].enabled = true;

    this.interactionHandler.visualisation3DHandler.visualizationData.axisTitles = this.selectedIndicators;
    this.visualisation3DPlotter.plotRuleIndicators(this.selectedIndicators, this.rulsetIndicatorsJSON, this.rulsetJSON);
  }

  //#endregion

  //#region Download and Init

  private initPlot(): void {
    const firstDataEntry = this.rulsetIndicatorsJSON[0];
    this.indicators = Object.keys(firstDataEntry.indicators).map((indicator) => {
      return {
        name: indicator,
        enabled: false,
      };
    });
  }

  private getData(): void {
    // check storage for data otherwise download
    this.downloadManager.submitQueueElement('ruleSet');
    this.downloadManager.submitQueueElement('ruleSetIndicators');

    this.projectService
      .getRuleSet(this.datasetId ?? 0, this.ruleSetId ?? 0)
      .pipe(takeUntil(this.ngUnsubcribe))
      .subscribe((ruleSet) => {
        this.rulsetJSON = ruleSet;
        this.downloadManager.updateQueueElementStatus('ruleSet', 'done');
      });

    this.projectService
      .getRulesIndicators(this.datasetId ?? 0, this.ruleSetId ?? 0)
      .pipe(takeUntil(this.ngUnsubcribe))
      .subscribe((ruleSetIndicators) => {
        this.rulsetIndicatorsJSON = ruleSetIndicators;
        this.downloadManager.updateQueueElementStatus('ruleSetIndicators', 'done');
      });
  }

  //#endregion
}
