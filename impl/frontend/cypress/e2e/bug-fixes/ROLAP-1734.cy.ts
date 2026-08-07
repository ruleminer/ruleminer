import { getTranslation } from '@e2e-helpers/translations';
import { AppLanguages } from '@e2e-helpers/types';

describe('Test ROLAP-1734', () => {
  beforeEach(() => {
    cy.prepareTest();
  });

  it('Should correctly translate sample projects section', () => {
    cy.changeLanguage(AppLanguages.EN);

    getTranslation(AppLanguages.EN).then((data) => {
      if (data.project && data.project.sample_projects) {
        const expectedText = data.project.sample_projects.trim();

        cy.get('[data-cy="project-sample-projects"]')
          .should('exist')
          .and('be.visible')
          .invoke('text')
          .should((actualText) => {
            expect(actualText.trim()).to.eq(expectedText);
          });
      }
    });
  });
});
