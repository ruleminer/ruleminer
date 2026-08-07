import { ProblemTypes } from '@e2e-helpers/../../projects/rolap/src/app/main/data-upload/utils/enums';

//* Helper for <rolap-predicted-condition />
// This utility provides methods to interact with the Prediction condition component.
class Prediction {
  private selectors = {
    predictionCondition: "[data-cy='predicted-condition']",
  };

  /**
   * Checks the confusion matrix based on the problem type.
   * @param problemType - The type of the problem.
   */
  public checkConfusionMatrixExistence(problemType: ProblemTypes): void {
    if (problemType === ProblemTypes.Classification) {
      cy.get(this.selectors.predictionCondition).should('exist');
    } else {
      cy.get(this.selectors.predictionCondition).should('not.exist');
    }
  }
}

export const prediction = new Prediction();
