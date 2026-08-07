import { Injectable } from '@angular/core';

import { Question } from '../../../../../models/project';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  public inputNames: { [key: string]: number | null } = {};

  public generateQuestions(questions: Question[]) {
    const regex = /\{.*\}/;
    const mapDataPL: any = {};
    const mapDataENG: any = {};

    questions.forEach((question, questionIndex) => {
      const tENG: any[] = [];
      const tPL: any[] = [];

      question.question_answers.forEach((answer, answerIndex) => {
        tENG[answerIndex] = answer.answer_text_en.split(/\s*({.*})\s*/);
        tPL[answerIndex] = answer.answer_text_pl.split(/\s*({.*})\s*/);
      });

      mapDataENG[questionIndex] = tENG.map((sentence: any[]) => {
        return sentence.map((word) => {
          const match = word.match(regex);
          if (!match) return { string: word, type: 'text' };
          const matchedString = match[0].replace(/[{}]/g, '');
          this.inputNames[matchedString] = null;
          return { string: matchedString, type: 'input' };
        });
      });

      mapDataPL[questionIndex] = tPL.map((sentence: any[]) => {
        return sentence.map((word) => {
          const match = word.match(regex);
          return match ? { string: match[0].replace(/[{}]/g, ''), type: 'input' } : { string: word, type: 'text' };
        });
      });

      question.question_answers.forEach((answer) => {
        answer.answer_text_en = mapDataENG[questionIndex];
        answer.answer_text_pl = mapDataPL[questionIndex];
      });
    });

    return questions;
  }
}
