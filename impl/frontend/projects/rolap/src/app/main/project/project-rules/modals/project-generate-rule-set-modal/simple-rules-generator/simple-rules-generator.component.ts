import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { StepperComponent } from '../../../../../../common/components/stepper/stepper.component';
import { Question } from '../../../../models/project';
import { QuestionService } from './service/question-service.service';
import { Answer } from './types';

type ExtraValues = {
  [key: string]: number | null;
};
export type SelectedAnswer = { questionNumber: number; selectedAnswer: number; nextQuestionNumber: number };

export type ParamsChangeObject = {
  selectedAnswers: SelectedAnswer[];
  extraValues: ExtraValues;
  setShowConfirmModal: boolean;
};

@Component({
  selector: 'rolap-simple-rules-generator',
  templateUrl: './simple-rules-generator.component.html',
  styleUrls: ['./simple-rules-generator.component.scss'],
})
export class SimpleRulesGeneratorComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(StepperComponent) stepper: StepperComponent;
  @Input() questions: Question[];

  @Output() paramsChange: EventEmitter<ParamsChangeObject> = new EventEmitter<ParamsChangeObject>();

  public currentParameters: { [key: string]: any };
  public extraValues: ExtraValues = this.questionService.inputNames;
  public currentLanguage: string;

  public selectedAnswers: SelectedAnswer[] = [];
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private translateService: TranslateService, private questionService: QuestionService) {}

  ngOnInit(): void {
    this.updateCurrentLang();
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.updateCurrentLang();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questions']) {
      this.selectedAnswers = this.questions.map((question) => {
        return {
          questionNumber: question.question_number,
          selectedAnswer: question.question_answers[0].answer_number,
          nextQuestionNumber: question.question_answers[0].next_question_number,
        };
      });
      this.emitParamsChange(false);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onInputChange(name: string): void {
    if (this.extraValues[name]! < 0) {
      this.extraValues[name] = 0;
    } else if (this.extraValues[name]! > 100) {
      this.extraValues[name] = 100;
    }
    this.emitParamsChange(true);
  }

  public selectAnswer(e: any, questionNumber: number): void {
    const copyOfSelectedAnswers = [...this.selectedAnswers];

    const answer: Answer = e.value;
    const index = copyOfSelectedAnswers.findIndex((item) => item.questionNumber === questionNumber);

    copyOfSelectedAnswers[index].selectedAnswer = answer.answer_number;
    copyOfSelectedAnswers[index].nextQuestionNumber = answer.next_question_number as number;

    this.selectedAnswers = [...copyOfSelectedAnswers];
    this.emitParamsChange(true);
  }

  private emitParamsChange(setShowConfirmModal: boolean): void {
    const selectedAnswers = this.selectedAnswers;
    const extraValues = this.extraValues;
    this.paramsChange.emit({ selectedAnswers, extraValues, setShowConfirmModal });
  }

  private updateCurrentLang(): void {
    this.currentLanguage = this.translateService.currentLang;
  }

  public stepNext(): void {
    const currentIndex = this.stepper?.activeStepIndex || 0;
    const findNextQuestion = this.selectedAnswers.find((ans) => ans.questionNumber === currentIndex + 1);
    if (!findNextQuestion) return;
    const nextStepIndex = this.questions.findIndex((q) => q.question_number === findNextQuestion.nextQuestionNumber);
    this.stepper.setActiveStep(nextStepIndex, true);
  }

  public stepBack(): void {
    const currentIndex = this.stepper?.activeStepIndex || 0;
    const findPreviusQuestion = this.selectedAnswers.find((ans) => ans.nextQuestionNumber === currentIndex + 1);
    if (!findPreviusQuestion) return;
    const prevStepIndex = this.questions.findIndex((q) => q.question_number === findPreviusQuestion.questionNumber);
    this.stepper.setActiveStep(prevStepIndex, true);
  }
}
