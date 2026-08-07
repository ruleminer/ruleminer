import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytesToMb',
  standalone: true,
})
export class BytesToMbPipe implements PipeTransform {
  transform(value: number, key: string) {
    const formatArrayList = ['max_sum_size', 'max_size', 'space_used'];
    if (!formatArrayList.includes(key)) return value;
    const mbValue = value / (1024 * 1024);
    return mbValue.toFixed(2) + ' MB';
  }
}
