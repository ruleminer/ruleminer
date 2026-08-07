import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firstLetter',
})
export class FirstLetterPipe implements PipeTransform {
  /**
   * Return first letter of given string.
   *
   * @param value
   */
  transform(value: string): string {
    if (!value) return '';
    return value.slice(0, 1);
  }
}
