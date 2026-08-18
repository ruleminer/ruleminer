import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { Subject, debounceTime, takeUntil } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

/*
Komponent wyświetlający wiadomość o błędzie walidacji pola formularza. Obsługuje komunikaty
o podstawowych błędach takich jak required, minlenght itp. Dla samodzielnie zdefiniowanych
walidatorów należy dodać komunikat jaki ma być dla niego wyświetlany w pliku pl.json aplikacji
pod kluczem "validators.<NAZWA_BŁĘDU>" np "validators.forbiddenNameValidator" oraz przekazać jakie to
błędy poprzez input customErrors
*/

export enum FieldName {
  NAME = 'name',
  PROJECT_NAME = 'project_name',
  PROJECT_DESCRIPTION = 'project_description',
  DATASET_NAME = 'dataset_name',
  DATASET_DESCRIPTION = 'dataset_description',
  RULE_NAME = 'rule_name',
  RULE_DESCRIPTION = 'rule_description',
  REPORT_NAME = 'report_name',
}

@Component({
  selector: 'rolap-validation-message',
  templateUrl: './validation-message.component.html',
  styleUrls: ['./validation-message.component.scss'],
})
export class ValidationMessageComponent implements OnInit, OnDestroy {
  @Input() control: AbstractControl;
  @Input() customErrors: string[] = [];
  @Input() fieldName: FieldName;
  public name = '';
  private readonly field = 'form_validation_module.names.';
  private ngUnsubscribe: Subject<void> = new Subject();

  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.assignFieldName();

    this.control.valueChanges.pipe(debounceTime(300), takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.control.markAsTouched();
    });

    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.assignFieldName();
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private assignFieldName() {
    switch (this.fieldName) {
      case FieldName.PROJECT_NAME:
        this.name = this.translateService.instant(this.field + FieldName.PROJECT_NAME);
        break;
      case FieldName.PROJECT_DESCRIPTION:
        this.name = this.translateService.instant(this.field + FieldName.PROJECT_DESCRIPTION);
        break;
      case FieldName.DATASET_NAME:
        this.name = this.translateService.instant(this.field + FieldName.DATASET_NAME);
        break;
      case FieldName.DATASET_DESCRIPTION:
        this.name = this.translateService.instant(this.field + FieldName.DATASET_DESCRIPTION);
        break;
      case FieldName.RULE_NAME:
        this.name = this.translateService.instant(this.field + FieldName.RULE_NAME);
        break;
      case FieldName.RULE_DESCRIPTION:
        this.name = this.translateService.instant(this.field + FieldName.RULE_DESCRIPTION);
        break;
      case FieldName.REPORT_NAME:
        this.name = this.translateService.instant(this.field + FieldName.REPORT_NAME);
        break;
      default:
        this.name = this.translateService.instant(this.field + FieldName.NAME);
        break;
    }
  }
}
