import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subscription, take } from 'rxjs';

import { Modal } from 'projects/rolap/src/app/common/services/modal/modal';

import { RulesetEntry } from '../../../../models/project';
import { ProjectService } from '../../../../service/project.service';

@Component({
  selector: 'rolap-select-rulesets-modal',
  templateUrl: './select-rulesets-modal.component.html',
  styleUrls: ['./select-rulesets-modal.component.scss'],
})
export class SelectRulesetsModalComponent implements OnInit, OnDestroy {
  @Input() datasetId: number;
  @Input() secondRulesetId: number;

  public rulesetList: RulesetEntry[] = [];
  private subscription: Subscription | null;

  constructor(
    private projectService: ProjectService,
    private modal: Modal<SelectRulesetsModalComponent>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.downloadRulesets();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  public get getCount(): number {
    return this.rulesetList.filter((ruleset: any) => ruleset.data.active).length;
  }

  public toggleRuleset(ruleset: any): void {
    this.rulesetList = this.rulesetList.map((rulesetItem: any) => {
      if (rulesetItem.id === ruleset.id) {
        return {
          ...rulesetItem,
          data: {
            active: true,
          },
        };
      }
      return {
        ...rulesetItem,
        data: {
          active: false,
        },
      };
    });
  }

  public compareRulesets(): void {
    const selectedRulesets = this.rulesetList.filter((ruleset: any) => ruleset.data.active);
    if (selectedRulesets.length !== 1) return;

    this.modal.close(selectedRulesets);
  }

  private downloadRulesets(): void {
    this.subscription = this.projectService
      .getRulesetList(this.datasetId)
      .pipe(take(1))
      .subscribe((rulesets: any) => {
        this.rulesetList = rulesets.map((ruleset: any, index: number) => {
          let active = false;
          if (this.secondRulesetId > 0) {
            active = ruleset.id === this.secondRulesetId;
          } else {
            active = index === 0;
          }
          return {
            ...ruleset,
            data: {
              active: active,
            },
          };
        });
        this.cdr.detectChanges();
      });
  }
}
