import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { nanoid } from 'nanoid';

import { IStepperStep, StepperStepComponent } from './components/stepper-step/stepper-step.component';

export interface StepChangeEvent {
  stepComponent: StepperStepComponent;
  index: number;
  previousIndex: number;
  previousTabComponent: StepperStepComponent | null;
}

@Component({
  selector: 'rolap-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent implements AfterViewInit, OnDestroy, AfterContentChecked {
  @Input() allowGoingFurther = false;
  @ContentChildren(IStepperStep) tabs: QueryList<IStepperStep>;
  @Output() stepChange: EventEmitter<StepChangeEvent> = new EventEmitter();
  @Output() completed: EventEmitter<number> = new EventEmitter();
  private oldStepsCount: number;
  public stepsContents: TemplateRef<any>[];
  private ngUnsubscribe: Subject<void> = new Subject();
  public stepsComponents: StepperStepComponent[];
  public activeStepIndex: number;
  public activeStep: StepperStepComponent | null;
  public finished = false;
  public id: string;

  public firstValidIndex: number | null;
  public lastValidIndex: number | null;

  constructor(private elementRef: ElementRef, private changeDetector: ChangeDetectorRef) {
    this.id = nanoid();
  }

  private setupStepsListeners() {
    // odsubskrybowanie wszystkich stepów - na wypadek zmiany ich liczby
    this.ngUnsubscribe.next(undefined);
    this.ngUnsubscribe.complete();
    this.ngUnsubscribe = new Subject();
    // ponowne zasubskrybowanie wszystkich stepów
    for (let i = 0; i < this.stepsComponents.length; i++) {
      this.stepsComponents[i].visiblity.pipe(takeUntil(this.ngUnsubscribe)).subscribe((isVisible: boolean) => {
        this.refreshSteps();
        if (this.stepsComponents[this.activeStepIndex].active) {
          throw Error('Tried to hide currently active step');
        } else {
          this.updateFirstAndLastValidIndices();
        }
      });
      this.stepsComponents[i].select.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
        this.setActiveStep(i);
      });
      if (this.stepsComponents[i].active) {
        this.setActiveStep(i);
      }
    }
  }

  public setActiveStep(index: number, fromWithinComponent = false) {
    if (!fromWithinComponent && index > this.activeStepIndex && !this.allowGoingFurther) {
      return;
    }
    if (!this.stepsComponents[index]?.isVisible) {
      throw Error(`Cannot go to step with index: ${index} as it is not visible`);
    }
    if (index !== this.activeStepIndex) {
      const previousIndex = this.activeStepIndex;
      this.activeStepIndex = index;
      this.stepsComponents[index].active = true;
      if (this.activeStep) {
        this.activeStep.active = false;
      }
      this.changeDetector.detectChanges();
      this.activeStep = this.stepsComponents[index];
      this.stepChange.emit({
        stepComponent: this.stepsComponents[this.activeStepIndex],
        index: this.activeStepIndex,
        previousIndex: previousIndex,
        previousTabComponent: this.stepsComponents[previousIndex],
      });

      this.elementRef.nativeElement.style.setProperty(
        '--current-step-index',
        this.calculateVisibleStepIndex(this.stepsComponents[index]),
      );
      this.stepsComponents.forEach((step) => (step.currentStepIndex = this.activeStepIndex));

      this.updateFirstAndLastValidIndices();
    }
  }

  /**
   * Calculates index of current step in the array of all visible steps.
   * Some steps may be hidden thats why this index may not be the same as
   * real index in the list of step components.
   */
  private calculateVisibleStepIndex(stepComponent: StepperStepComponent): number {
    let activeStepIndexInHeader = 0;
    for (let i = 0; i < this.stepsComponents.length; i++) {
      if (this.stepsComponents[i].id !== stepComponent.id) {
        break;
      }
      if (this.stepsComponents[i].isVisible) {
        activeStepIndexInHeader++;
      }
    }
    return activeStepIndexInHeader;
  }

  private updateFirstAndLastValidIndices() {
    this.firstValidIndex = this.getFirstValidStepIndexGreaterThan(-1);
    this.lastValidIndex = this.getFirstValidStepIndexLowerThan(this.stepsComponents.length);
    setTimeout(() => {
      this.changeDetector.detectChanges();
    }, 0);
  }

  private getFirstValidStepIndexGreaterThan(startIndex = 0): number | null {
    for (let i = startIndex + 1; i < this.stepsComponents.length; i++) {
      if (this.stepsComponents[i].isVisible) {
        return i;
      }
    }
    return null;
  }

  private getFirstValidStepIndexLowerThan(startIndex = 0): number | null {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (this.stepsComponents[i].isVisible) {
        return i;
      }
    }
    return null;
  }

  public stepNext() {
    if (this.activeStepIndex < this.stepsComponents.length - 1) {
      // find first next valid (active and visible step)
      const nextValidStepIndex = this.getFirstValidStepIndexGreaterThan(this.activeStepIndex);
      if (nextValidStepIndex !== null) {
        this.setActiveStep(nextValidStepIndex, true);
      } else {
        this.completed.emit(this.activeStepIndex);
      }
    } else {
      this.completed.emit(this.activeStepIndex);
    }
  }

  public stepBack() {
    if (this.activeStepIndex > 0 && this.stepsComponents.length > 0) {
      // find first previous valid (active and visible step)
      const previousValidStepIndex = this.getFirstValidStepIndexLowerThan(this.activeStepIndex);
      if (previousValidStepIndex === null) return;
      this.setActiveStep(previousValidStepIndex, true);
    }
  }

  private refreshSteps() {
    let stepsCounts = 0;
    this.stepsComponents = (this.tabs as any)._results;
    for (let i = 0; i < this.stepsComponents.length; i++) {
      this.stepsComponents[i].index = stepsCounts;
      this.stepsComponents[i].allowGoingFurther = this.allowGoingFurther;
      if (this.stepsComponents[i].isVisible) stepsCounts++;
    }
    this.oldStepsCount = this.stepsComponents.length;
    this.elementRef.nativeElement.style.setProperty('--steps-count', stepsCounts);
    setTimeout(() => {
      this.changeDetector.detectChanges();
    }, 0);
  }

  private setup() {
    this.refreshSteps();
    this.setupStepsListeners();
    const activeStep = this.getFirstValidStepIndexGreaterThan(-1);

    if (activeStep !== null) this.setActiveStep(activeStep, true);
  }

  ngOnDestroy(): void {
    this.finished = true;
    this.stepsComponents = [];
    this.activeStep = null;
    this.stepsContents?.forEach((t) => t.elementRef?.nativeElement?.remove());
    this.stepsContents = [];
    this.changeDetector.detectChanges();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngAfterContentChecked(): void {
    if ((this.tabs as any)._results.length !== this.oldStepsCount) {
      // nasłuchiwanie zmiany ilości stepó
      setTimeout(() => {
        this.setup();
        if (this.activeStepIndex >= this.stepsComponents.length) {
          this.setActiveStep(0);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.stepsContents = this.stepsComponents.filter((c) => c.isVisible).map((c) => c.content.templateRef!);
      }, 200);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setup();
    }, 0);
  }
}
