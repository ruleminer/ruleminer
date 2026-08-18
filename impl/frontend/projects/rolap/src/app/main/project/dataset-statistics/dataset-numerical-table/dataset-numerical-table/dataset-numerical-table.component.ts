import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Observable, Subject, switchMap, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { Column } from 'devextreme/ui/data_grid';

@Component({
  selector: 'rolap-dataset-numerical-table',
  templateUrl: './dataset-numerical-table.component.html',
  styleUrls: ['./dataset-numerical-table.component.scss'],
})
export class DatasetNumericalTableComponent implements OnInit, OnDestroy {
  @Input() dataSource: Observable<any>;

  public gridColumns: Column[] = [
    { dataField: 'attributes', caption: this.translate.instant('dataset.statistic_tab.attributes') },
    { dataField: 'mean', caption: this.translate.instant('dataset.statistic_tab.mean'), dataType: 'number' },
    { dataField: 'max', caption: this.translate.instant('dataset.statistic_tab.max'), dataType: 'number' },
    { dataField: 'min', caption: this.translate.instant('dataset.statistic_tab.min'), dataType: 'number' },
    {
      dataField: 'missing_values_count',
      caption: this.translate.instant('dataset.statistic_tab.missing_values_count'),
      dataType: 'number',
    },
  ];

  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    this.setUpLanguageChange();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setUpLanguageChange(): void {
    this.translate.onLangChange
      .pipe(
        switchMap(() => this.translate.get('dataset.statistic_tab')),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((translations) => {
        this.gridColumns = this.gridColumns.map((column) => ({
          ...column,
          caption: translations[column.dataField!] || column.caption,
        }));
      });
  }
}
