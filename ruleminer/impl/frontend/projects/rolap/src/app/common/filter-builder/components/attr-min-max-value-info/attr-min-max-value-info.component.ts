import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, map, ReplaySubject, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { selectCurrentV2RulesTableAttributesMinMaxValues } from '../../../../common/store/v2RulesTable/v2RulesTable.selectors';
import { filterOutNullish } from '../../../utils/rxjsUtils';

@Component({
  selector: 'rolap-attr-min-max-value-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attr-min-max-value-info.component.html',
})
export class AttrMinMaxValueInfoComponent {
  private store = inject(Store);
  private attributeNameSubject = new ReplaySubject<string>(1);

  @Input()
  set attributeName(value: string | undefined) {
    if (value) {
      this.attributeNameSubject.next(value);
    }
  }

  public attributeStats$ = this.attributeNameSubject.pipe(
    filter(name => name.length > 0),
    distinctUntilChanged(),
    switchMap(currentAttrName =>
      this.store.select(selectCurrentV2RulesTableAttributesMinMaxValues).pipe(
        filterOutNullish(),
        map(attributesMinMaxValues => attributesMinMaxValues[currentAttrName]),
        map((values) => {
          if (!values ||
            values.min === undefined ||
            values.max === undefined ||
            (values.min + values.max === 0)) {
            return null;
          }
          return { min: values.min, max: values.max };
        })
      )
    )
  )
}