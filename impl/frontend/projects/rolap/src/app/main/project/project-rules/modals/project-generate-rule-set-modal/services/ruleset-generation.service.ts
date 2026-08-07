import { Injectable, inject } from '@angular/core';

import { Observable, map, switchMap } from 'rxjs';

import { isNull, isObject, omitBy, pickBy, some } from 'lodash';

import { RuleSetGenerationRequest } from '../../../../../../common/services/rule-set/rule-set-api';
import { RuleSetApiService } from '../../../../../../common/services/rule-set/rule-set-api.service';
import { convertJSONValues } from '../../../../../data-upload/utils/utils';
import { ProcessCreatedResponse } from '../../../../models/ruleset';
import { ProjectService } from '../../../../service/project.service';
import { RuleSetGenerationMethods } from '../algorithm-configuration/types';
import { QuestionRequest } from '../simple-rules-generator/types';
import { RulesetGenerateForAlgorithmData } from './types';

@Injectable({
  providedIn: 'root',
})
export class RulesetGenerationService {
  private ruleSetService = inject(RuleSetApiService);
  private projectService = inject(ProjectService);

  public generateRulesetForAlgorithm(data: RulesetGenerateForAlgorithmData): Observable<any> {
    if (data.generationMethod === RuleSetGenerationMethods.Simple) {
      return this.generateRulesetUsingQuestionsAnswers(data);
    } else {
      return this.generateRulesetUsingAlgorithmParams(data);
    }
  }

  private generateRulesetUsingAlgorithmParams(
    data: RulesetGenerateForAlgorithmData,
  ): Observable<ProcessCreatedResponse> {
    const body: RuleSetGenerationRequest = {
      name: data.rulesetName,
      description: '', // at the moment there is no way to set description when generating ruleset
      generation_method: data.algorithm.name,
      algorithm_params: convertJSONValues(data.algorithmParams),
      attributes_to_skip: data.attributesToSkip,
      cross_validation: data.crossValidation.enabled,
      num_folds: data.crossValidation.numFolds,
      prediction_config: data.predictionConfig,
      algorithm_id: data.algorithm.id,
    };
    if (data.expertInduction.enabled) {
      body.expert_induction = {
        decision_attribute: data.decisionAttributeName,
        ...data.expertInduction.params,
      };
    }
    return this.ruleSetService.postRuleSetGeneration(data.ids.dataSetId!, body);
  }

  private generateRulesetUsingQuestionsAnswers(
    data: RulesetGenerateForAlgorithmData,
  ): Observable<ProcessCreatedResponse> {
    // get parameters values from questions answers from api
    const selectedAnswersMap: Record<string, string> = {};
    data.questionsAnswers.selectedAnswers.forEach((answer) => {
      selectedAnswersMap[answer.questionNumber.toString()] = answer.selectedAnswer.toString();
    });
    const bodySendQuestionForAlgorithm = this.createRequestSendQuestionForAlgorithmBody(
      selectedAnswersMap,
      data.questionsAnswers.extraValues,
    );
    return this.projectService
      .sendQuestionForAlgorithm(data.ids.dataSetId!, data.algorithm.id, bodySendQuestionForAlgorithm)
      .pipe(
        map((sendQuestionForAlgorithm) => {
          return pickBy(sendQuestionForAlgorithm, (value) => value !== null);
        }),
        switchMap((algorithmParams) => this.generateRulesetUsingAlgorithmParams({ ...data, algorithmParams })),
      );
  }

  private createRequestSendQuestionForAlgorithmBody(
    selectedAnswersMap: Record<string, string>,
    extraValues: Record<string, number | null> | null,
  ): QuestionRequest {
    let body: QuestionRequest = {
      answers: selectedAnswersMap,
      ...(extraValues && { extra_values: { ...extraValues } }),
    };
    //omitBy is used to remove null values from the object
    body = omitBy(body, (value) => isObject(value) && some(value, isNull)) as QuestionRequest;
    return body;
  }
}
