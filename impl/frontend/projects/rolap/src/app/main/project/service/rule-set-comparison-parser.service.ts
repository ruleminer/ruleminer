import { Injectable, inject } from '@angular/core';

import { Store } from '@ngrx/store';

import { AppState } from '../../../common/store/app-state.model';
import { V2ComparisonActions } from '../../../common/store/v2Comparison/v2Comparison.action';
import { RuleSimilarity } from '../models/ruleset';
import { PreparedRule } from '../project-ruleset-comparison/types';

@Injectable()
export class RulesetComparisonParserService {
  private store = inject(Store<AppState>);

  private totalCount = 0;

  private convertToTableFormat(data: RuleSimilarity, rulesetOne: any[], rulesetTwo: any[]) {
    const tableData: {
      premiseOneAutoIncrement: number;
      premise1: string;
      premiseTwoAutoIncrement: number;
      premise2: string;
      similarity: number;
    }[] = [];

    for (const uuid1 in data) {
      for (const uuid2 in data[uuid1]) {
        const number = data[uuid1][uuid2];
        const ruleIndex = rulesetOne.findIndex((r) => r.uuid === uuid1);
        const ruleTwoIndex = rulesetTwo.findIndex((r) => r.uuid === uuid2);

        const row = {
          premise1: rulesetOne[ruleIndex].string,
          premise2: rulesetTwo[ruleTwoIndex].string,
          similarity: Number((Math.round(number * 10000) / 10000).toFixed(4)),
          premiseOneAutoIncrement: rulesetOne[ruleIndex].autoIncrement,
          premiseTwoAutoIncrement: rulesetTwo[ruleTwoIndex].autoIncrement,
        };

        tableData.push(row);
      }
    }

    tableData.sort((a, b) => {
      return a.similarity > b.similarity ? -1 : 1;
    });

    return tableData;
  }

  public setData(data: RuleSimilarity, rulesetOne: PreparedRule[], rulesetTwo: PreparedRule[]): void {
    const parsedData = this.convertToTableFormat(data, rulesetOne, rulesetTwo);
    this.totalCount = parsedData.length;
    this.store.dispatch(V2ComparisonActions.setCalculatedData({ data: parsedData }));
  }

  public getTotalCount(): number {
    return this.totalCount;
  }
}
