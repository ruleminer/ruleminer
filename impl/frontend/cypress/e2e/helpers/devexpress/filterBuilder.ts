import { ProblemTypes } from "../../../../projects/rolap/src/app/main/data-upload/utils/enums";

export class FilterBuilderHelper {
	public selectors = {
		filterBuilderContainer: '[data-cy="filter-builder"]',
        dxScrollableContainer: '.dx-scrollable-container',
		group: 'rolap-condition-group',
		rootGroup: 'rolap-condition-group.root-group',
		conditionGroupByIndex: (index: number) => `[data-cy="condition-group-${index}"]`,
		groupHeader: '.group-header',
		groupLogicRadio: (groupSelector: string) => `${groupSelector} dx-radio-group`,
		groupAndOption: (groupSelector: string) => `${groupSelector} .group-logic .dx-item:contains("AND")`,
		groupOrOption: (groupSelector: string) => `${groupSelector} .group-logic .dx-item:contains("OR")`,
		addConditionButtonRoot: '[data-cy="filter-builder-add-condition-root"]',
		addGroupButtonRoot: '[data-cy="filter-builder-add-group-root"]',
		addConditionButtonNested: (groupIndex: number) => `[data-cy="filter-builder-add-condition-${groupIndex}"]`,
		addGroupButtonNested: (groupIndex: number) => `[data-cy="filter-builder-add-group-${groupIndex}"]`,
		removeGroupButtonNested: (groupIndex: number) => `[data-cy="filter-builder-remove-group-${groupIndex}"]`,
		ruleItemWrapper: (rowIndex: number) => `[data-cy="rule-item-wrapper-${rowIndex}"]`,
		conditionRowContainer: (rowIndex: number) => `[data-cy="condition-row-container-${rowIndex}"]`,
		fieldSelect: (rowIndex: number) => `[data-cy="condition-row-field-select-${rowIndex}"] dx-select-box`,
		operatorSelect: (rowIndex: number) => `[data-cy="condition-row-operator-select-${rowIndex}"] dx-select-box`,
		valueInputContainer: (rowIndex: number) => `[data-cy="condition-row-value-input-container-${rowIndex}"]`,
		removeConditionButton: (rowIndex: number) => `[data-cy="condition-row-remove-button-${rowIndex}"] dx-button`,
		valueInputText: (rowIndex: number) => `[data-cy="condition-row-value-input-text-${rowIndex}"] dx-text-box`,
		valueInputNumeric: (rowIndex: number) => `[data-cy="condition-row-value-input-numeric-${rowIndex}"]`,
		valueInputDate: (rowIndex: number) => `[data-cy="condition-row-value-input-date-${rowIndex}"] dx-date-box`,
		valueInputSelect: (rowIndex: number) => `[data-cy="condition-row-value-input-select-${rowIndex}"]`,
		valueInputBoolean: (rowIndex: number) => `[data-cy="condition-row-value-input-boolean-${rowIndex}"] dx-select-box`,
		valueInputNumericStart: (rowIndex: number) => `[data-cy="condition-row-value-input-numeric-start-${rowIndex}"] dx-number-box`,
		valueInputNumericEnd: (rowIndex: number) => `[data-cy="condition-row-value-input-numeric-end-${rowIndex}"] dx-number-box`,
		valueInputDateStart: (rowIndex: number) => `[data-cy="condition-row-value-input-date-start-${rowIndex}"] dx-date-box`,
		valueInputDateEnd: (rowIndex: number) => `[data-cy="condition-row-value-input-date-end-${rowIndex}"] dx-date-box`,
		noValueNeededSpan: (rowIndex: number) => `[data-cy="condition-row-no-value-needed-${rowIndex}"]`,
		dxPopupContent: '.dx-popup-content',
		dxListItem: '.dx-list-item',
		dxTextBoxInput: '.dx-texteditor-input',
		dxDateBoxInput: '.dx-datebox-input',
		dxNumberBoxInput: '.dx-texteditor-input',
	};

	private getGroupContext(groupSelector?: string): Cypress.Chainable<JQuery<HTMLElement>> {
		const contextSelector = groupSelector || this.selectors.rootGroup;
		return cy.get(this.selectors.filterBuilderContainer).find(contextSelector);
	}

	private getRuleItem(rowIndex: number, groupSelector?: string): Cypress.Chainable<JQuery<HTMLElement>> {
		return this.getGroupContext(groupSelector).find(this.selectors.ruleItemWrapper(rowIndex));
	}

    private scrollContainerUntilVisible(
        scrollContainerChain: Cypress.Chainable<JQuery<HTMLElement>>,
        targetElementSelector: string,
        attemptsLeft = 20
    ): void {
        if (attemptsLeft === 0) {
            cy.log('Max scroll attempts reached. Failing.');
            cy.get(targetElementSelector).should('be.visible');
            return;
        }

        cy.get('body').then($body => {
            if ($body.find(`${targetElementSelector}:visible`).length > 0) {
                return;
            }

            scrollContainerChain.trigger('wheel', {
                deltaY: 250,
                wheelDelta: -250,
                bubbles: true,
            });

            cy.wait(100);

            this.scrollContainerUntilVisible(scrollContainerChain, targetElementSelector, attemptsLeft - 1);
        });
    }

	private selectDxSelectBoxOptionByText(selectBoxElement: Cypress.Chainable<JQuery<HTMLElement>>, text: string): void {
		selectBoxElement.click();
		cy.get(this.selectors.dxPopupContent)
			.filter(':visible')
			.find(this.selectors.dxListItem)
			.contains(new RegExp(`^${text.trim()}$`))
			.should('be.visible')
			.scrollIntoView()
			.click({ force: true });
	}

	private typeInDxScopedInput(componentElement: Cypress.Chainable<JQuery<HTMLElement>>, inputClassSelector: string, value: string, isNumeric: boolean = false): void {
		componentElement
			.find(inputClassSelector)
			.should('be.visible')
			.clear({ force: true })
			.type(value, { force: true });

		if (isNumeric) {
			componentElement
				.find(inputClassSelector)
				.trigger('input', { force: true })
				.trigger('change', { force: true })
				.trigger('blur', { force: true });
		}
	}

	private setNumericValueWithEvents(componentElement: Cypress.Chainable<JQuery<HTMLElement>>, inputClassSelector: string, value: string): void {
		componentElement
			.find(inputClassSelector)
			.should('be.visible')
			.focus({ force: true })
			.clear({ force: true })
			.type(value, { force: true, delay: 50 })
			.trigger('input', { force: true })
			.trigger('change', { force: true })
			.trigger('keydown', { keyCode: 13, force: true })
			.trigger('keyup', { keyCode: 13, force: true })
			.blur({ force: true });
	}

	private findVisibleValueInputSelector(
		rowIndex: number,
		expectedType: 'text' | 'numeric' | 'date' | 'select' | 'boolean' | 'numeric-start' | 'numeric-end' | 'date-start' | 'date-end',
		groupSelector?: string
	): Cypress.Chainable<string> {
		return this.getRuleItem(rowIndex, groupSelector)
			.find(this.selectors.valueInputContainer(rowIndex))
			.then($container => {
				let selector = '';
				if ($container.find(this.selectors.valueInputSelect(rowIndex).replace(/ dx-select-box$/, '')).is(':visible')) {
					selector = this.selectors.valueInputSelect(rowIndex);
				} else if ($container.find(this.selectors.valueInputBoolean(rowIndex).replace(/ dx-select-box$/, '')).is(':visible')) {
					selector = this.selectors.valueInputBoolean(rowIndex);
				} else if ($container.find(this.selectors.valueInputText(rowIndex).replace(/ dx-text-box$/, '')).is(':visible')) {
					selector = this.selectors.valueInputText(rowIndex);
				} else if ($container.find(this.selectors.valueInputNumeric(rowIndex).replace(/ dx-number-box$/, '')).is(':visible')) {
					selector = this.selectors.valueInputNumeric(rowIndex);
				} else if ($container.find(this.selectors.valueInputDate(rowIndex).replace(/ dx-date-box$/, '')).is(':visible')) {
					selector = this.selectors.valueInputDate(rowIndex);
				} else if ($container.find(this.selectors.valueInputNumericStart(rowIndex).replace(/ dx-number-box$/, '')).is(':visible')) {
					selector = expectedType === 'numeric-start' ? this.selectors.valueInputNumericStart(rowIndex) : this.selectors.valueInputNumericEnd(rowIndex);
				} else if ($container.find(this.selectors.valueInputDateStart(rowIndex).replace(/ dx-date-box$/, '')).is(':visible')) {
					selector = expectedType === 'date-start' ? this.selectors.valueInputDateStart(rowIndex) : this.selectors.valueInputDateEnd(rowIndex);
				} else if ($container.find(this.selectors.noValueNeededSpan(rowIndex)).is(':visible')) {
					selector = this.selectors.noValueNeededSpan(rowIndex);
				}

				if (!selector) {
					cy.log(`WARN: Could not determine visible value input for row ${rowIndex}, group ${groupSelector}, expected ${expectedType}. Defaulting to select.`);
					selector = this.selectors.valueInputSelect(rowIndex);
				}
				return selector;
			});
	}

	private setValueForRow(
		rowIndex: number,
		value: any,
		expectedInputTypeHint: 'text' | 'numeric' | 'date' | 'select' | 'boolean',
		groupSelector?: string
	): void {
		const stringValue = String(value);
		this.findVisibleValueInputSelector(rowIndex, expectedInputTypeHint, groupSelector).then(foundSelectorString => {
			const targetInputElement = this.getRuleItem(rowIndex, groupSelector)
				.find(this.selectors.valueInputContainer(rowIndex))
				.find(foundSelectorString.substring(foundSelectorString.indexOf('[')));
			if (foundSelectorString === this.selectors.noValueNeededSpan(rowIndex)) {
				targetInputElement.should('be.visible');
			} else if (expectedInputTypeHint === 'select' || expectedInputTypeHint === 'boolean') {
				this.selectDxSelectBoxOptionByText(targetInputElement, stringValue);
			} else if (expectedInputTypeHint === 'date') {
				this.typeInDxScopedInput(targetInputElement, this.selectors.dxDateBoxInput, stringValue);
				targetInputElement.find(this.selectors.dxDateBoxInput).blur();
			} else if (expectedInputTypeHint === 'numeric') {
				this.setNumericValueWithEvents(targetInputElement, this.selectors.dxNumberBoxInput, stringValue);
			} else if (expectedInputTypeHint === 'text') {
				this.typeInDxScopedInput(targetInputElement, this.selectors.dxTextBoxInput, stringValue);
				targetInputElement.find(this.selectors.dxTextBoxInput).blur();
			} else {
				cy.log(`ERROR: Interaction not defined for unexpected selector: ${foundSelectorString} or hint: ${expectedInputTypeHint}`);
				throw new Error(`Interaction not defined for unexpected selector found: ${foundSelectorString}`);
			}
		});
	}

	private setBetweenValueForRow(
		rowIndex: number,
		startValue: any,
		endValue: any,
		expectedInputType: 'numeric' | 'date',
		groupSelector?: string
	): void {
		this.findVisibleValueInputSelector(rowIndex, `${expectedInputType}-start` as any, groupSelector).then(startSelectorString => {
			const startInputElement = this.getRuleItem(rowIndex, groupSelector)
				.find(this.selectors.valueInputContainer(rowIndex))
				.find(startSelectorString.substring(startSelectorString.indexOf('[')));
			this.findVisibleValueInputSelector(rowIndex, `${expectedInputType}-end` as any, groupSelector).then(endSelectorString => {
				const endInputElement = this.getRuleItem(rowIndex, groupSelector)
					.find(this.selectors.valueInputContainer(rowIndex))
					.find(endSelectorString.substring(endSelectorString.indexOf('[')));
				const startString = String(startValue);
				const endString = String(endValue);
				if (expectedInputType === 'date') {
					this.typeInDxScopedInput(startInputElement, this.selectors.dxDateBoxInput, startString);
					startInputElement.find(this.selectors.dxDateBoxInput).blur();
					this.typeInDxScopedInput(endInputElement, this.selectors.dxDateBoxInput, endString);
					endInputElement.find(this.selectors.dxDateBoxInput).blur();
				} else {
					this.setNumericValueWithEvents(startInputElement, this.selectors.dxNumberBoxInput, startString);
					this.setNumericValueWithEvents(endInputElement, this.selectors.dxNumberBoxInput, endString);
				}
			});
		});
	}

	private clickAndOrOption(groupSelector: string, optionText: 'AND' | 'OR'): void {
		const groupLogicSelectBoxElement = this.getGroupContext(groupSelector)
			.find(`dx-select-box[formcontrolname="condition"]`)
			.first();
		groupLogicSelectBoxElement
			.should('exist', `Group logic select box with formcontrolname="condition" should exist in ${groupSelector}`)
			.and('be.visible')
			.and('not.have.class', 'dx-state-disabled');

		this.selectDxSelectBoxOptionByText(groupLogicSelectBoxElement, optionText);
	}

	private extractIndexFromGroupSelector(groupSelector: string): number {
		const match = groupSelector.match(/-\D*(\d+)"?\]?$/);
		if (match && match[1]) {
			return parseInt(match[1], 10);
		}
		if (groupSelector.includes('-root')) {
			console.warn("Attempting to extract index from a root selector for a nested button:", groupSelector);
			return -1;
		}
		throw new Error(`Could not extract index from group selector: ${groupSelector}`);
	}

	private clickAddConditionButton(groupSelector: string): void {
		const isRootContext = groupSelector === this.selectors.rootGroup || !groupSelector.startsWith(this.selectors.conditionGroupByIndex(0).substring(0, this.selectors.conditionGroupByIndex(0).indexOf('0') - 1));
		let buttonSelector;
		if (isRootContext) {
			buttonSelector = this.selectors.addConditionButtonRoot;
		} else {
			const groupIndex = this.extractIndexFromGroupSelector(groupSelector);
			buttonSelector = this.selectors.addConditionButtonNested(groupIndex);
		}

		this.getGroupContext(groupSelector)
			.find(buttonSelector)
			.should('be.visible').and('not.be.disabled')
			.click();
	}

	private clickAddGroupButton(groupSelector: string): void {
		const isRootContext = groupSelector === this.selectors.rootGroup || !groupSelector.startsWith(this.selectors.conditionGroupByIndex(0).substring(0, this.selectors.conditionGroupByIndex(0).indexOf('0') - 1));
		let buttonSelector;

		if (isRootContext) {
			buttonSelector = this.selectors.addGroupButtonRoot;
		} else {
			const groupIndex = this.extractIndexFromGroupSelector(groupSelector);
			buttonSelector = this.selectors.addGroupButtonNested(groupIndex);
		}

		this.getGroupContext(groupSelector)
			.find(buttonSelector)
			.should('be.visible')
			.click();
	}

	private clickRemoveGroupButton(groupSelector: string): void {
		const groupIndex = this.extractIndexFromGroupSelector(groupSelector);
		const buttonSelector = this.selectors.removeGroupButtonNested(groupIndex);

		this.getGroupContext(groupSelector)
			.find(buttonSelector)
			.should('be.visible')
			.click();
	}

	private clickRemoveConditionButton(rowIndex: number, groupSelector?: string): void {
		this.getRuleItem(rowIndex, groupSelector)
			.find(this.selectors.removeConditionButton(rowIndex))
			.should('be.visible')
			.click();
	}

	private selectFieldForRow(rowIndex: number, fieldText: string, groupSelector?: string): void {
		const fieldSelectElement = this.getRuleItem(rowIndex, groupSelector)
			.find(this.selectors.fieldSelect(rowIndex));
		fieldSelectElement.should('exist');
		this.selectDxSelectBoxOptionByText(fieldSelectElement, fieldText);
	}

	private selectOperatorForRow(rowIndex: number, operatorText: string, groupSelector?: string): void {
		const operatorSelectElement = this.getRuleItem(rowIndex, groupSelector)
			.find(this.selectors.operatorSelect(rowIndex));
		operatorSelectElement.should('exist');
		this.selectDxSelectBoxOptionByText(operatorSelectElement, operatorText);
	}

	public setGroupCondition(condition: 'AND' | 'OR', groupSelector: string = this.selectors.rootGroup): void {
		this.clickAndOrOption(groupSelector, condition);
	}

	public addCondition(groupSelector: string = this.selectors.rootGroup): void {
		this.clickAddConditionButton(groupSelector);
	}

	public addGroup(groupSelector: string = this.selectors.rootGroup): void {
		this.clickAddGroupButton(groupSelector);
	}

	public removeCondition(rowIndex: number, groupSelector: string = this.selectors.rootGroup): void {
		this.clickRemoveConditionButton(rowIndex, groupSelector);
	}

	public removeGroup(groupSelector: string): void {
		if (groupSelector === this.selectors.rootGroup) {
			throw new Error("Cannot remove the root group.");
		}
		this.clickRemoveGroupButton(groupSelector);
	}

	public selectField(rowIndex: number, fieldText: string, groupSelector: string = this.selectors.rootGroup): void {
		this.selectFieldForRow(rowIndex, fieldText, groupSelector);
	}

	public selectOperator(rowIndex: number, operatorText: string, groupSelector: string = this.selectors.rootGroup): void {
		this.selectOperatorForRow(rowIndex, operatorText, groupSelector);
	}

	public setValue(
		rowIndex: number,
		value: any,
		expectedInputTypeHint: 'text' | 'numeric' | 'date' | 'select' | 'boolean',
		groupSelector: string = this.selectors.rootGroup
	): void {
		this.setValueForRow(rowIndex, value, expectedInputTypeHint, groupSelector);
	}

	public setBetweenValue(
		rowIndex: number,
		startValue: any,
		endValue: any,
		expectedInputType: 'numeric' | 'date',
		groupSelector: string = this.selectors.rootGroup
	): void {
		this.setBetweenValueForRow(rowIndex, startValue, endValue, expectedInputType, groupSelector);
	}

	public fillConditionRow(rowIndex: number, config: {
		field: string;
		operator: string;
		value?: any;
		startValue?: any;
		endValue?: any;
		valueInputTypeHint: 'text' | 'numeric' | 'date' | 'select' | 'boolean';
		betweenInputTypeHint?: 'numeric' | 'date';
	}, groupSelector: string = this.selectors.rootGroup): void {
		this.selectFieldForRow(rowIndex, config.field, groupSelector);
		this.selectOperatorForRow(rowIndex, config.operator, groupSelector);

		cy.wait(500);

		if (config.operator === 'Between' && config.betweenInputTypeHint && config.startValue !== undefined && config.endValue !== undefined) {
			this.setBetweenValueForRow(rowIndex, config.startValue, config.endValue, config.betweenInputTypeHint, groupSelector);
		} else if (config.operator !== 'Is Null' && config.operator !== 'Is Not Null' && config.value !== undefined) {
			this.setValueForRow(rowIndex, config.value, config.valueInputTypeHint, groupSelector);
		} else if (config.operator === 'Is Null' || config.operator === 'Is Not Null') {
			this.getRuleItem(rowIndex, groupSelector)
				.find(this.selectors.noValueNeededSpan(rowIndex))
				.should('be.visible');
		} else {
			cy.log(`Value was undefined for row ${rowIndex} (group: ${groupSelector}) with operator ${config.operator}, but operator might require a value.`);
		}
	}

	public addConditionWithDummyData(problemType: ProblemTypes) {
        cy.get(this.selectors.addConditionButtonRoot).should('be.visible');

		cy.get(this.selectors.filterBuilderContainer).then($builder => {
			const initialCount = $builder.find('rolap-condition-row').length;
			cy.log(`Initial condition count (by component tag): ${initialCount}`);
			const newConditionRowIndex = initialCount;

			this.addCondition();

			if (initialCount > 0) {
                const scrollContainer = cy.get(this.selectors.filterBuilderContainer)
                    .parents(this.selectors.dxScrollableContainer)
                    .first();
                const targetRowSelector = this.selectors.ruleItemWrapper(newConditionRowIndex);
                this.scrollContainerUntilVisible(scrollContainer, targetRowSelector);
			}

			cy.get(this.selectors.ruleItemWrapper(newConditionRowIndex))
				.should('be.visible');

			if (problemType === ProblemTypes.Classification) {
				this.fillConditionRow(newConditionRowIndex, {
					field: 'hair',
					operator: '=',
					value: 'False',
					valueInputTypeHint: 'select'
				});
			} else if (problemType === ProblemTypes.Regression) {
				this.fillConditionRow(newConditionRowIndex, {
					field: 'CRIM',
					operator: '<',
					value: 900,
					valueInputTypeHint: 'numeric'
				});
			} else {
				this.fillConditionRow(newConditionRowIndex, {
					field: 'donor_age',
					operator: '<',
					value: 900,
					valueInputTypeHint: 'numeric'
				});
			}
		});
	}
}

export const filterBuilder = new FilterBuilderHelper();