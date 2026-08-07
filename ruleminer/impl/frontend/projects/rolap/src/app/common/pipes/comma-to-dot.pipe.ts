import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commaToDot',
  standalone: true,
})
export class CommaToDotPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return value;
    }
    return value.replace(/,/g, '.');
  }
}
