import { AppLanguages } from '@e2e-helpers/types';

export function getTranslation(lang: AppLanguages) {
  return cy.readFile(`projects/rolap/src/assets/i18n/${lang}.json`);
}
