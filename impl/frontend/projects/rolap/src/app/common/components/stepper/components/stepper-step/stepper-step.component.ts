import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import { Observable, Subject, Subscription, filter, take } from 'rxjs';

import { nanoid } from 'nanoid';

export class IStepperStep {}

@Directive({ selector: '[step-content]' })
export class StepContentDirective implements OnDestroy {
  constructor(public viewContainer: ViewContainerRef, public templateRef: TemplateRef<any> | null) {}

  ngOnDestroy(): void {
    this.templateRef = null;
    this.viewContainer.clear();
  }
}

@Component({
  selector: 'rolap-stepper-step',
  templateUrl: './stepper-step.component.html',
  styleUrls: ['./stepper-step.component.scss'],
  providers: [
    {
      provide: IStepperStep,
      useExisting: StepperStepComponent,
    },
  ],
})
export class StepperStepComponent implements AfterViewInit, OnChanges, OnDestroy {
  public isVisible: boolean = true;
  @Input() set visible(value: boolean) {
    if (value !== this.isVisible) {
      this.isVisible = value;
      this.listItemSubscription?.unsubscribe();
      this.listItemSubscription = this.listItemElement
        .pipe(
          filter((item: HTMLElement) => item !== null),
          take(1),
        )
        .subscribe((item: HTMLElement) => {
          item.style.display = value ? 'flex' : 'none';
        });
      this.visiblity$.next(value);
    }
  }
  private _index: number;
  @Input() set index(number: number) {
    this._index = number;
  }
  public get index(): number {
    return this._index;
  }
  @Input() allowGoingFurther = true;
  @Input() currentStepIndex: number;
  @Output() select: EventEmitter<void> = new EventEmitter();
  private _active: boolean;
  @Input() set active(value: boolean) {
    this._active = value;
  }
  public get active(): boolean {
    return this._active;
  }
  @ContentChild(StepContentDirective) content: StepContentDirective;
  public id: string;
  public visiblity$: Subject<boolean> = new Subject();
  public disabled = false;
  private listItemSubscription: Subscription | null = null;
  private listItemElement: Subject<HTMLElement> = new Subject();

  public get visiblity(): Observable<boolean> {
    return this.visiblity$.asObservable();
  }

  constructor(private element: ElementRef, private cdr: ChangeDetectorRef) {
    this.id = `step-${nanoid()}`;
    this.element.nativeElement.setAttribute('id', this.id);
  }

  ngAfterViewInit(): void {
    this.disabled = !this.allowGoingFurther && this.currentStepIndex < this.index;
    this.wrapTabInListItemElement();

    this.cdr.detectChanges();
  }

  ngOnChanges(simpleChanges: SimpleChanges): void {
    if (simpleChanges['currentStepIndex'] || simpleChanges['allowGoingFurther'] || simpleChanges['index']) {
      this.disabled = !this.allowGoingFurther && this.currentStepIndex < this.index;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.content?.ngOnDestroy();
    this.select.complete();
  }

  private wrapTabInListItemElement() {
    const element: HTMLElement = this.element.nativeElement;
    const parent: HTMLElement | null = element.parentElement;

    if (!parent) return;
    const listElement = document.createElement('li');
    listElement.style.flex = '1';
    listElement.style.justifyContent = 'center';
    listElement.style.display = 'flex';
    listElement.appendChild(element);
    parent.appendChild(listElement);
    this.listItemElement.next(listElement);
  }
}
