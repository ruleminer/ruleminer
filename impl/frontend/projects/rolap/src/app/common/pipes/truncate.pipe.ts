import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateString',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: any): string {
    if (value.length > 10) {
      return value.substring(0, 10) + '...';
    }
    return value;
  }
}
