import { Router } from '@angular/router';

import { map } from 'rxjs';

import { Store } from '@ngrx/store';

import { ModalService } from '../../services/modal/modal.service';
import { AppState } from '../../store/app-state.model';
import { ProjectActions } from '../../store/project/project.action';
import { TourPosition, TourStep } from './types';
import { waitForElement } from './utils';

export const tourSteps = (router: Router, modalService?: ModalService, store?: Store<AppState>): TourStep[] => {
  return [
    {
      element: '#create-project',
      title: 'tour.create_project.title',
      content: 'tour.create_project.content',
      route: ['/home', '/projects'],
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#search-projects',
      title: 'tour.search.title',
      content: 'tour.search.content',
      route: ['/home', '/projects'],
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#project-summary',
      title: 'tour.summary.title',
      content: 'tour.summary.content',
      route: ['/home', '/projects'],
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#sort-projects',
      title: 'tour.sort.title',
      content: 'tour.sort.content',
      route: ['/home', '/projects'],
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#project-list',
      title: 'tour.project_list.title',
      content: 'tour.project_list.content',
      position: TourPosition.RIGHT,
      route: ['/home', '/projects'],
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#sample-projects',
      title: 'tour.recent_project_list.title',
      content: 'tour.recent_project_list.content',
      route: ['/home', '/projects'],
      onPrevTriggerAction: () => {
        router.navigate(['/home']);
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#treeView',
      title: 'tour.treeView.title',
      content: 'tour.treeView.content',
      position: TourPosition.RIGHT,
      onNextTriggerAction: () => {
        // Expand all tree nodes using store action
        if (store) {
          store.dispatch(ProjectActions.expandAllTreeNodes());
        }

        const element = document.querySelector('#project_sample_button_classification');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#tree-item-dataset',
      title: 'tour.treeView.datasetItem',
      content: 'tour.treeView.content',
      position: TourPosition.RIGHT,
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '[data-cy="tree-item-rulesets_group"]',
      title: 'tour.rulesets_group.title',
      content: 'tour.rulesets_group.content',
      position: TourPosition.RIGHT,

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#tree-item-ruleset',
      title: 'tour.ruleSetItem.title',
      content: 'tour.ruleSetItem.content',
      position: TourPosition.RIGHT,
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#tab-bar-list',
      title: 'tour.tabBar.title',
      content: 'tour.tabBar.content',
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#sub-tab-button-list',
      title: 'tour.subTabButton.title',
      content: 'tour.subTabButton.content',

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rolap-dataset-view-table',
      title: 'tour.dataset_view_table.title',
      content: 'tour.dataset_view_table.content',
      position: TourPosition.LEFT,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-0');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) => {
        return waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        );
      },
    },
    {
      element: '#rolap-description-form',
      title: 'tour.description.title',
      content: 'tour.description.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-1');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '.second-child',
      title: 'tour.dataset_information.title',
      content: 'tour.dataset_information.content',
      position: TourPosition.BOTTOM,
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#numerical_attributes',
      title: 'tour.numerical_attributes.title',
      content: 'tour.numerical_attributes.content',
      position: TourPosition.LEFT,

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#nominal_attributes',
      title: 'tour.nominal_attributes.title',
      content: 'tour.nominal_attributes.content',
      position: TourPosition.BOTTOM,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-1');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#dataset-correlation-matrix',
      title: 'tour.dataset_correlation_matrix.title',
      content: 'tour.dataset_correlation_matrix.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-2');
        if (!element) return;
        (element as HTMLElement).click();
      },

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#dataset-histogram-chart',
      title: 'tour.dataset_histogram_chart.title',
      content: 'tour.dataset_histogram_chart.content',
      position: TourPosition.TOP,

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rolap-dataset-bar-chart',
      title: 'tour.rolap_dataset_bar_chart.title',
      content: 'tour.rolap_dataset_bar_chart.content',
      position: TourPosition.TOP,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#tree-item-dataset');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rules-table-component',
      title: 'tour.rules_table.title',
      content: 'tour.rules_table.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#tree-item-ruleset');
        if (!element) return;
        (element as HTMLElement).click();
      },
      onPrevTriggerAction: () => {
        const element = document.querySelector('#tree-item-dataset');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rules-prediction-indicators',
      title: 'tour.rules_prediction_indicators.title',
      content: 'tour.rules_prediction_indicators.content',
      position: TourPosition.RIGHT,

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rules-quantitative-characteristics',
      title: 'tour.rules_quantitative_characteristics.title',
      content: 'tour.rules_quantitative_characteristics.content',
      position: TourPosition.LEFT,
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rules-importance-card',
      title: 'tour.rules_importance_card.title',
      content: 'tour.rules_importance_card.content',
      position: TourPosition.TOP,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-0');

        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#project-rules-coverage',
      title: 'tour.project_rules_coverage.title',
      content: 'tour.project_rules_coverage.content',
      position: TourPosition.TOP,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-1');

        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#project-rules-coverage-table',
      title: 'tour.project_rules_coverage_table.title',
      content: 'tour.project_rules_coverage_table.content',
      position: TourPosition.TOP,

      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-1');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#comparison-form',
      title: 'tour.comparison_form.title',
      content: 'tour.comparison_form.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-2');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#comparsion-rules-table',
      title: 'tour.comparison_rules_table.title',
      content: 'tour.comparison_rules_table.content',
      position: TourPosition.TOP,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-2');

        if (!element) return;
        (element as HTMLElement).click();
      },
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-2');

        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#alignment-button-group',
      title: 'tour.alignment_button_group.title',
      content: 'tour.alignment_button_group.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-3');

        if (!element) return;
        (element as HTMLElement).click();
      },

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rules-and-conditions-select-list',
      title: 'tour.rules_and_conditions_select_list.title',
      content: 'tour.rules_and_conditions_select_list.content',
      position: TourPosition.RIGHT,
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#visualisation-coverage-info',
      title: 'tour.visualisation_coverage_info.title',
      content: 'tour.visualisation_coverage_info.content',
      position: TourPosition.LEFT,
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#rolap-graph-plot',
      title: 'tour.rolap_graph_plot.title',
      content: 'tour.rolap_graph_plot.content',
      position: TourPosition.LEFT,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-3');

        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#prediction-settings',
      title: 'tour.prediction_settings.title',
      content: 'tour.prediction_settings.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-4');

        if (!element) return;
        (element as HTMLElement).click();
      },

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#prediction-result',
      title: 'tour.prediction_result.title',
      content: 'tour.prediction_result.content',
      position: TourPosition.TOP,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-4');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#prediction-computer',
      title: 'tour.prediction_computer.title',
      content: 'tour.prediction_computer.content',
      position: TourPosition.TOP,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-4');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#prediction-settings',
      title: 'tour.prediction_settings.title',
      content: 'tour.prediction_settings.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-5');
        if (!element) return;
        (element as HTMLElement).click();
      },
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-4');
        if (!element) return;
        (element as HTMLElement).click();
      },

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#prediction-test-left',
      title: 'tour.prediction_test_left.title',
      content: 'tour.prediction_test_left.content',
      position: TourPosition.RIGHT,

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#prediction-test-right',
      title: 'tour.prediction_test_right.title',
      content: 'tour.prediction_test_right.content',
      position: TourPosition.LEFT,
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-5');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#project-example',
      title: 'tour.project_example.title',
      content: 'tour.project_example.content',
      position: TourPosition.BOTTOM,
      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-6');
        if (!element) return;
        (element as HTMLElement).click();
      },
      onPrevTriggerAction: () => {
        const element = document.querySelector('#sub-tab-6');
        if (!element) return;
        (element as HTMLElement).click();
      },

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#description-left',
      title: 'tour.description_left.title',
      content: 'tour.description_left.content',
      position: TourPosition.RIGHT,

      onNextTriggerAction: () => {
        const element = document.querySelector('#sub-tab-7');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#description-right',
      title: 'tour.description_right.title',
      content: 'tour.description_right.content',
      position: TourPosition.LEFT,
      isTreeView: true,
      onPrevTriggerAction: () => {
        if (!modalService) return;
        const activeModals = modalService.getActiveModals();
        if (activeModals.length === 1) {
          const modalRef = activeModals[0];
          modalRef.close();

          setTimeout(() => {
            const element = document.querySelector('#tree-item-ruleset');

            (element as HTMLElement).click();
          }, 500);
        }
      },

      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#algorithm-chooser-modal',
      title: 'tour.algorithm.title',
      content: 'tour.algorithm.content',
      position: TourPosition.RIGHT,
      isTreeView: true,
      isModal: true,
      onNextTriggerAction: () => {
        const element = document.querySelector('#tree-item-dataset');
        if (!element) return;
        (element as HTMLElement).click();

        setTimeout(() => {
          const generateElement = document.querySelector('#action-bar-0');

          (generateElement as HTMLElement).click();
        }, 500);
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#configuration',
      title: 'tour.algorithm_configuration.title',
      content: 'tour.algorithm_configuration.content',
      position: TourPosition.LEFT,
      isModal: true,
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
    {
      element: '#generate-button',
      title: 'tour.generate-button.title',
      content: 'tour.generate-button.content',
      position: TourPosition.TOP,
      isModal: true,
      onExitClick: () => {
        const element = document.querySelector('#generate-button');
        if (!element) return;
        (element as HTMLElement).click();
      },
      isViewLoaded: (element) =>
        waitForElement(element).pipe(
          map((element) => {
            if (!element) return false;
            return true;
          }),
        ),
    },
  ];
};
