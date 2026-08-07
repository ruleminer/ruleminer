import { createDevExtremeDataGrid } from '@e2e-helpers/devexpress/DataGrid/dataGird';
import { projectRulesTableColumnChooser } from '@e2e-helpers/rolap/projectRulesTable/columnChooserBtn';
import { subTabButtons } from '@e2e-helpers/rolap/subTabButtons';
import { treeview } from '@e2e-helpers/rolap/treeview';
import { AppLanguages } from '@e2e-helpers/types';
import 'cypress-if';
import { ProblemTypes } from 'projects/rolap/src/app/main/data-upload/utils/enums';

import { SubTabsNames } from '../../../projects/rolap/src/app/common/store/app-state.model';

describe('Test ROLAP-1827', () => {
  beforeEach(() => {
    cy.prepareTest();
    cy.changeLanguage(AppLanguages.PL);
  });

  /**
   * Helper function to verify the visible headers in the data grid.
   * @param {Array} expectedHeaders - Array of expected header names.
   */
  const verifyVisibleHeaders = (expectedHeaders: string[]) => {
    const dataGrid = createDevExtremeDataGrid('[data-cy="rules-big-table"]');
    dataGrid.headers.getAllVisibleHeaders().then((headers) => {
      expect(headers).to.deep.eq(expectedHeaders);
    });
  };

  /**
   * Helper function to verify the state of the column chooser.
   * @param {Array} expectedDisabled - Array of expected disabled checkboxes.
   * @param {Array} expectedEnabled - Array of expected enabled checkboxes.
   */
  const verifyColumnChooserState = (expectedDisabled: string[], expectedEnabled: string[]) => {
    projectRulesTableColumnChooser.scrollToBottom().then(() => {
      cy.wait(3000);
      projectRulesTableColumnChooser.getDisabledCheckboxTexts().then((texts) => {
        expect(texts).to.deep.eq(expectedDisabled);
      });
      projectRulesTableColumnChooser.getEnabledCheckboxTexts().then((texts) => {
        expect(texts).to.deep.eq(expectedEnabled);
      });
    });
  };
  Cypress._.times(1, (k) => {
    it('Project Rules Table should display columns in correct order on init for Classification', () => {
      cy.createSampleProject(ProblemTypes.Classification);
      treeview.openFirstRuleSet();
      verifyVisibleHeaders([
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'Precyzja',
        'Pokrycie',
      ]);

      subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);
      verifyVisibleHeaders([
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Filtruj zbiór danych',
        'Pokaż pokrycie',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'Precyzja',
        'Pokrycie',
      ]);

      subTabButtons.goToSubTab(SubTabsNames.RULE_COMPARISON);
      verifyVisibleHeaders([
        '#',
        'Etykiety',
        'Porównanie',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'Precyzja',
        'Pokrycie',
      ]);
    });

    it('Project Rules Table Column chooser should have some columns disabled based on current sub tab for Classification', () => {
      cy.createSampleProject(ProblemTypes.Classification);
      treeview.openFirstRuleSet();

      const expectedEnabledCheckboxes = [
        'Precyzja',
        'Pokrycie',
        'p',
        'n',
        'P',
        'N',
        'Liczba warunków',
        'Liczba pokrytych przykładów',
        'p wartość',
        'Wsparcie',
        'Korelacja',
        'C2',
        'RSS',
        'Lift',
        'Nagative predictive value',
        'Czułość',
        'Swoistość',
        'Odds ratio',
        'Relative risk',
        'LR+',
        'LR-',
      ];

      // projectRulesTableColumnChooser.assertColumnChooserNotVisible();
      projectRulesTableColumnChooser.clickColumnChooserButton();
      projectRulesTableColumnChooser.assertColumnChooserVisible();

      const expectedDisabledCheckboxesInit = [
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Przesłanka reguły',
        'Konkluzja reguły',
      ];

      verifyColumnChooserState(expectedDisabledCheckboxesInit, expectedEnabledCheckboxes);

      subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);
      projectRulesTableColumnChooser.clickColumnChooserButton();
      projectRulesTableColumnChooser.assertColumnChooserVisible();

      const expectedDisabledCheckboxesCoverage = [
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Filtruj zbiór danych',
        'Pokaż pokrycie',
        'Przesłanka reguły',
        'Konkluzja reguły',
      ];

      verifyColumnChooserState(expectedDisabledCheckboxesCoverage, expectedEnabledCheckboxes);

      projectRulesTableColumnChooser.clickColumnChooserCloseButton();
      subTabButtons.goToSubTab(SubTabsNames.RULE_COMPARISON);

      const dataGrid = createDevExtremeDataGrid('[data-cy="rules-big-table"]');
      dataGrid.assertExist();
      dataGrid.loader.assertNoLoader();

      projectRulesTableColumnChooser.clickColumnChooserButton();
      projectRulesTableColumnChooser.assertColumnChooserVisible();

      const expectedDisabledCheckboxesComparison = ['#', 'Etykiety', 'Przesłanka reguły'];

      verifyColumnChooserState(expectedDisabledCheckboxesComparison, expectedEnabledCheckboxes);
      projectRulesTableColumnChooser.clickColumnChooserCloseButton();
    });

    it('Project Rules Table should display columns in correct order on init for Regression', () => {
      cy.createSampleProject(ProblemTypes.Regression);
      treeview.openFirstRuleSet();

      verifyVisibleHeaders([
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'box-plot',
        'MAE',
        'RMSE',
      ]);

      subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);
      verifyVisibleHeaders([
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Filtruj zbiór danych',
        'Pokaż pokrycie',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'box-plot',
        'MAE',
        'RMSE',
      ]);

      subTabButtons.goToSubTab(SubTabsNames.RULE_COMPARISON);
      verifyVisibleHeaders([
        '#',
        'Etykiety',
        'Porównanie',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'box-plot',
        'MAE',
        'RMSE',
      ]);
    });

    it('Project Rules Table Column chooser should have some columns disabled based on current sub tab for Regression', () => {
      cy.createSampleProject(ProblemTypes.Regression);
      treeview.openFirstRuleSet();

      const expectedEnabledCheckboxes = [
        'MAE',
        'RMSE',
        'p',
        'n',
        'P',
        'N',
        'Liczba warunków',
        'Liczba pokrytych przykładów',
        'p wartość',
        'Precyzja',
        'Pokrycie',
        'Wsparcie',
        'Średnia pokrytych przykładów',
        'Odchylenie std. pokrytych przykładów',
        'Minimum pokrytych przykładów',
        'Maximum pokrytych przykładów',
        'MAPE',
      ];

      // projectRulesTableColumnChooser.assertColumnChooserNotVisible();
      projectRulesTableColumnChooser.clickColumnChooserButton();
      projectRulesTableColumnChooser.assertColumnChooserVisible();

      const expectedDisabledCheckboxesInit = [
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'box-plot',
      ];

      verifyColumnChooserState(expectedDisabledCheckboxesInit, expectedEnabledCheckboxes);

      subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);
      projectRulesTableColumnChooser.clickColumnChooserButton();
      projectRulesTableColumnChooser.assertColumnChooserVisible();

      const expectedDisabledCheckboxesCoverage = [
        '#',
        'Operacje',
        'Etykiety',
        'Aktywna',
        'Filtruj zbiór danych',
        'Pokaż pokrycie',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'box-plot',
      ];

      const expectedEnabledCheckboxesCoverage = [
        'MAE',
        'RMSE',
        'p',
        'n',
        'P',
        'N',
        'Liczba warunków',
        'Liczba pokrytych przykładów',
        'p wartość',
        'Precyzja',
        'Pokrycie',
        'Wsparcie',
        'Odchylenie std. pokrytych przykładów',
        'Minimum pokrytych przykładów',
        'Maximum pokrytych przykładów',
        'MAPE',
      ];

      verifyColumnChooserState(expectedDisabledCheckboxesCoverage, expectedEnabledCheckboxesCoverage);

      projectRulesTableColumnChooser.clickColumnChooserCloseButton();
      subTabButtons.goToSubTab(SubTabsNames.RULE_COMPARISON);

      const dataGrid = createDevExtremeDataGrid('[data-cy="rules-big-table"]');
      dataGrid.assertExist();
      dataGrid.loader.assertNoLoader();

      projectRulesTableColumnChooser.clickColumnChooserButton();
      projectRulesTableColumnChooser.assertColumnChooserVisible();

      const expectedDisabledCheckboxesComparison = [
        '#',
        'Etykiety',
        'Porównanie',
        'Przesłanka reguły',
        'Konkluzja reguły',
        'box-plot',
      ];

      const expectedEnabledCheckboxesComparison = [
        'MAE',
        'RMSE',
        'p',
        'n',
        'P',
        'N',
        'Liczba warunków',
        'Liczba pokrytych przykładów',
        'p wartość',
        'Precyzja',
        'Pokrycie',
        'Wsparcie',
        'Odchylenie std. pokrytych przykładów',
        'Minimum pokrytych przykładów',
        'Maximum pokrytych przykładów',
        'MAPE',
      ];

      verifyColumnChooserState(expectedDisabledCheckboxesComparison, expectedEnabledCheckboxesComparison);
      projectRulesTableColumnChooser.clickColumnChooserCloseButton();
    });

    // fit('Project Rules Table should display columns in correct order and column chooser should have correct state on init for Survival', () => {
    //   cy.createSampleProject(ProblemTypes.Survival);
    //   treeview.openFirstRuleSet();

    //   verifyVisibleHeaders([
    //     '#',
    //     'Operacje',
    //     'Etykiety',
    //     'Aktywna',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //     'Mediana czasu przeżycia',
    //     'Logrank',
    //   ]);

    //   const expectedEnabledCheckboxes = [
    //     'Mediana czasu przeżycia',
    //     'Logrank',
    //     'Liczba warunków',
    //     'Liczba pokrytych przykładów',
    //     'p wartość',
    //     'Liczba obserwacji dla których wystąpiło zdarzenie',
    //     'Liczba obserwacji cenzurowanych',
    //     'Dolna granica przedziału ufności czasu przeżycia',
    //     'Górna granica przedziału ufności czasu przeżycia',
    //   ];
    //   const expectedDisabledCheckboxesInit = [
    //     '#',
    //     'Operacje',
    //     'Etykiety',
    //     'Aktywna',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //   ];

    //   // projectRulesTableColumnChooser.assertColumnChooserNotVisible();
    //   projectRulesTableColumnChooser.clickColumnChooserButton();
    //   projectRulesTableColumnChooser.assertColumnChooserVisible();
    //   verifyColumnChooserState(expectedDisabledCheckboxesInit, expectedEnabledCheckboxes);

    //   subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);
    //   verifyVisibleHeaders([
    //     '#',
    //     'Operacje',
    //     'Etykiety',
    //     'Aktywna',
    //     'Filtruj zbiór danych',
    //     'Pokaż pokrycie',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //     'Mediana czasu przeżycia',
    //     'Logrank',
    //   ]);

    //   const expectedDisabledCheckboxesCoverage = [
    //     '#',
    //     'Operacje',
    //     'Etykiety',
    //     'Aktywna',
    //     'Filtruj zbiór danych',
    //     'Pokaż pokrycie',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //   ];

    //   projectRulesTableColumnChooser.clickColumnChooserButton();
    //   projectRulesTableColumnChooser.assertColumnChooserVisible();
    //   verifyColumnChooserState(expectedDisabledCheckboxesCoverage, expectedEnabledCheckboxes);
    //   projectRulesTableColumnChooser.clickColumnChooserCloseButton();

    //   subTabButtons.goToSubTab(SubTabsNames.RULE_COMPARISON);
    //   verifyVisibleHeaders([
    //     '#',
    //     'Etykiety',
    //     'Porównanie',
    //     'Przesłanka reguły',
    //     'Mediana czasu przeżycia',
    //     'Krzywa przeżycia',
    //     'Logrank',
    //   ]);

    //   const expectedDisabledCheckboxesComparison = [
    //     '#',
    //     'Etykiety',
    //     'Porównanie',
    //     'Aktywna',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //   ];

    //   projectRulesTableColumnChooser.clickColumnChooserButton();
    //   projectRulesTableColumnChooser.assertColumnChooserVisible();
    //   verifyColumnChooserState(expectedDisabledCheckboxesComparison, expectedEnabledCheckboxes);
    //   projectRulesTableColumnChooser.clickColumnChooserCloseButton();
    // });

    // fit('Project Rules Table Column chooser should have some columns disabled based on current sub tab for Survival', () => {
    //   cy.createSampleProject(ProblemTypes.Survival);
    //   treeview.openFirstRuleSet();

    //   const expectedEnabledCheckboxes = [
    //     'Mediana czasu przeżycia',
    //     'Logrank',
    //     'Liczba warunków',
    //     'Liczba pokrytych przykładów',
    //     'p wartość',
    //     'Liczba obserwacji dla których wystąpiło zdarzenie',
    //     'Liczba obserwacji cenzurowanych',
    //     'Dolna granica przedziału ufności czasu przeżycia',
    //     'Górna granica przedziału ufności czasu przeżycia',
    //   ];
    //   const expectedDisabledCheckboxesInit = [
    //     '#',
    //     'Operacje',
    //     'Etykiety',
    //     'Aktywna',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //   ];

    //   projectRulesTableColumnChooser.clickColumnChooserButton();
    //   projectRulesTableColumnChooser.assertColumnChooserVisible();
    //   verifyColumnChooserState(expectedDisabledCheckboxesInit, expectedEnabledCheckboxes);

    //   subTabButtons.goToSubTab(SubTabsNames.RULES_COVERAGE);
    //   verifyVisibleHeaders([
    //     '#',
    //     'Operacje',
    //     'Etykiety',
    //     'Aktywna',
    //     'Filtruj zbiór danych',
    //     'Pokaż pokrycie',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //     'Mediana czasu przeżycia',
    //     'Logrank',
    //   ]);

    //   const expectedDisabledCheckboxesCoverage = [
    //     '#',
    //     'Operacje',
    //     'Etykiety',
    //     'Aktywna',
    //     'Filtruj zbiór danych',
    //     'Pokaż pokrycie',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //   ];

    //   projectRulesTableColumnChooser.clickColumnChooserButton();
    //   projectRulesTableColumnChooser.assertColumnChooserVisible();
    //   verifyColumnChooserState(expectedDisabledCheckboxesCoverage, expectedEnabledCheckboxes);
    //   projectRulesTableColumnChooser.clickColumnChooserCloseButton();

    //   subTabButtons.goToSubTab(SubTabsNames.RULE_COMPARISON);
    //   verifyVisibleHeaders([
    //     '#',
    //     'Etykiety',
    //     'Porównanie',
    //     'Przesłanka reguły',
    //     'Mediana czasu przeżycia',
    //     'Krzywa przeżycia',
    //     'Logrank',
    //   ]);

    //   const expectedDisabledCheckboxesComparison = [
    //     '#',
    //     'Etykiety',
    //     'Porównanie',
    //     'Aktywna',
    //     'Przesłanka reguły',
    //     'Krzywa przeżycia',
    //   ];

    //   projectRulesTableColumnChooser.clickColumnChooserButton();
    //   projectRulesTableColumnChooser.assertColumnChooserVisible();
    //   verifyColumnChooserState(expectedDisabledCheckboxesComparison, expectedEnabledCheckboxes);
    //   projectRulesTableColumnChooser.clickColumnChooserCloseButton();
    // });
  });
});
