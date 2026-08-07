import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { ReplaySubject, Subject, take, takeUntil } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown } from '@fortawesome/pro-regular-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

import { ValuesStore } from './service/values-store';

enum DisplayTypes {
  ABSOLUTE = 'absolute',
  PERCENT = 'percent',
}

enum ValueChangesTypes {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NO_CHANGE = 'no-change',
}

interface ValueChange {
  absolute: number;
  fraction: number | null;
  percentage: number | null;
  type: ValueChangesTypes;
}

/**
 * Component for displaying value changes for numeric variables.
 */
@Component({
  selector: 'rolap-value-change-arrow',
  standalone: true,
  imports: [CommonModule, TranslateModule, FontAwesomeModule],
  templateUrl: './value-change-arrow.component.html',
  styleUrls: ['./value-change-arrow.component.scss'],
})
export class ValueChangeArrowComponent implements OnChanges, OnDestroy {
  public readonly numberFormat = '1.0-3';

  @Input() instanceId: string;
  @Input() valueStore: ValuesStore;
  @Input() value: number;
  @Input() precision = 0.001; // one-tenth of percent
  @Input() useFirstValueAsReference = true;
  @Input() higherIsBetter: boolean = true; // by default higher values are interpreted as better
  @Input() displayWhenNoChange: boolean = true;
  public previousValue: number | undefined;
  public valueChange: ValueChange;
  public displayType: DisplayTypes;

  public DisplayTypes = DisplayTypes;
  public isPositiveChange: boolean;
  public isNegativeChange: boolean;
  public isNoChange: boolean;

  public faArrowAltDown = faArrowDown;

  private ngUnsubscribe: Subject<void> = new Subject();
  private $initialized: ReplaySubject<void> = new ReplaySubject(1);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['instanceId']) {
      this.$initialized.next();
    }
    if (changes['value']) {
      this.$initialized.pipe(take(1), takeUntil(this.ngUnsubscribe)).subscribe(() => {
        this.onValueChange(this.value);
      });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private onValueChange(value: number | string) {
    if (value === undefined || value === null) return;
    const sanitizedValue: number = this.validateAndSanitizeValue(value);
    this.previousValue = this.valueStore.getValue(this.instanceId);

    if (this.previousValue !== undefined) {
      this.calculateValueChange(this.previousValue, sanitizedValue);
      this.selectValueChangeType(this.valueChange);
      this.selectDisplayType();
    }

    if (this.previousValue === undefined || !this.useFirstValueAsReference) {
      this.valueStore.setValue(this.instanceId, sanitizedValue);
    }
  }

  private validateAndSanitizeValue(value: string | number): number {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || value.replace('-', '') !== 'inf') {
      throw new Error(`Cell value ${value} is not a valid number! This component only supports numerical values.`);
    }
    // replace -inf and inf strings with numerical values
    return value.startsWith('-') ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }

  private calculateValueChange(previousValue: number, value: number) {
    const valueChange: ValueChange = {
      absolute: 0,
      percentage: null,
      fraction: null,
      type: ValueChangesTypes.NO_CHANGE,
    };

    valueChange.absolute = this.calculateAbsoluteChange(value, previousValue);

    if (previousValue === value) {
      valueChange.percentage = 0.0;
      valueChange.fraction = 0.0;
    } else if (previousValue !== 0 && Number.isFinite(previousValue)) {
      // cannot calculate percent change when previous value is 0 or inf or -inf (division by 0)
      valueChange.fraction = (value - previousValue) / previousValue;
      valueChange.percentage = valueChange.fraction * 100;
    }
    this.selectValueChangeType(valueChange);
    this.valueChange = valueChange;
  }

  private calculateAbsoluteChange(value: number, previousValue: number): number {
    // normal subtraction won't work with -inf and +inf values
    if (
      (value === Number.NEGATIVE_INFINITY && previousValue === Number.NEGATIVE_INFINITY) ||
      (value === Number.POSITIVE_INFINITY && previousValue === Number.POSITIVE_INFINITY)
    ) {
      return 0.0;
    }
    return value - previousValue;
  }

  private selectValueChangeType(valueChange: ValueChange) {
    this.isNegativeChange = this.isPositiveChange = this.isNoChange = false;
    const changeLowerThanPrecision = valueChange.fraction !== null && Math.abs(valueChange.fraction) < this.precision;

    if (valueChange.absolute === 0 || changeLowerThanPrecision) {
      valueChange.type = ValueChangesTypes.NO_CHANGE;
      this.isNoChange = true;
    } else if (valueChange.absolute > 0) {
      valueChange.type = this.higherIsBetter === false ? ValueChangesTypes.NEGATIVE : ValueChangesTypes.POSITIVE;
      this.isPositiveChange = true;
    } else {
      valueChange.type = this.higherIsBetter === false ? ValueChangesTypes.POSITIVE : ValueChangesTypes.NEGATIVE;
      this.isNegativeChange = true;
    }
  }

  private selectDisplayType() {
    // if cannot calculate percentage value change, display absolute value change
    if (this.valueChange.percentage === null) {
      this.displayType = DisplayTypes.ABSOLUTE;
      return;
    }
    // if value change is less than precision, display as 0.00%
    if (this.valueChange.type === ValueChangesTypes.NO_CHANGE) {
      this.displayType = DisplayTypes.PERCENT;
      return;
    }
    // if value is integer, display absolute value change
    if (Number.isInteger(this.value)) {
      this.displayType = DisplayTypes.ABSOLUTE;
      return;
    }
    // if value change is less than 0.1%, display absolute value change
    if (Math.abs(this.valueChange.percentage) < 0.1) {
      this.displayType = DisplayTypes.ABSOLUTE;
      return;
    }
    // if value change is greater than 100%, display absolute value change
    if (Math.abs(this.valueChange.percentage) > 100) {
      this.displayType = DisplayTypes.ABSOLUTE;
      return;
    }
    // if none of the above, display percentage value change
    this.displayType = DisplayTypes.PERCENT;
  }
}
