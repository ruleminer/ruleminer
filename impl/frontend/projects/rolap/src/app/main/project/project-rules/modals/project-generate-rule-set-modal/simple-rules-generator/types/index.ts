export interface QuestionRequest {
  answers: {
    [key: string]: string;
  };
  extra_values?: {
    [key: string]: number | null;
  } | null;
}

export interface Answer {
  answer_number: number;
  answer_text_pl: string;
  answer_text_en: string;
  next_question_number: number | null;
}

export interface Question {
  question_number: number;
  question_text_pl: string;
  question_text_en: string;
  question_answers: Answer[];
}
