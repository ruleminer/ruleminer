import { Pipe, PipeTransform } from '@angular/core';

import { Item } from '../tab-bar-item/tab-bar-item.component';
import { MAX_TAB_TEXT_LENGTH } from '../utils';

@Pipe({
  name: 'truncate',
})
export class AppBarTruncatePipe implements PipeTransform {
  transform(item: Item, maxLength = MAX_TAB_TEXT_LENGTH): string {
    const truncatedText =
      (item.text ?? '').length > maxLength ? (item.text ?? '').slice(0, maxLength) + '...' : item.text ?? '';

    if (item.isSaved) return truncatedText;
    return '*' + truncatedText;
  }
}
