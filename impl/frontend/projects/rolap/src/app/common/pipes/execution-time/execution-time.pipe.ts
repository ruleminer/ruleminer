import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'executionTime',
})
export class ExecutionTimePipe implements PipeTransform {
  transform(value: number, milis?: string): string {
    const seconds = Math.floor((value / 1000) % 60);
    const minutes = Math.floor((value / 1000 / 60) % 60);

    if (value < 60000) {
      // display only seconds if value is less than 60s
      if (milis) return `${value / 1000} s`;
      return `${seconds} s`;
    } else if (value < 3600000) {
      // display mm:ss if value is less than 1h
      return `${this.pad(minutes)} min ${this.pad(seconds)} s`;
    } else {
      // display hh:mm:ss if value is more or equal than 1h
      const hours = Math.floor(value / 1000 / 3600);
      return `${this.pad(hours)} h ${this.pad(minutes)} min ${this.pad(seconds)} s`;
    }
  }

  /**
   * Adds 0 to the begining if the number is less than 10.
   *
   * @param n - input number
   */
  private pad(n: number) {
    return n < 10 ? '0' + n.toString() : n.toString();
  }
}
