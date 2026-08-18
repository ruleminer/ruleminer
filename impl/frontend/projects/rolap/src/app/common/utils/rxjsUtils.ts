import { Observable, OperatorFunction, UnaryFunction, pipe, timer } from 'rxjs';
import { filter, retry } from 'rxjs/operators';

export function filterOutNullish<T>(): UnaryFunction<Observable<T | null | undefined>, Observable<T>> {
  return pipe(filter((x) => x != null) as OperatorFunction<T | null | undefined, T>);
}

/**
 * Creates a retry operator with configurable delay and maximum retry attempts
 *
 * @param duration - The base delay time between retry attempts (in milliseconds)
 * @param maxTries - Maximum number of retry attempts before giving up
 * @returns RxJS retry operator that implements exponential backoff
 *
 * @example
 * // Retry up to 3 times with 1-second intervals between attempts
 * someObservable.pipe(
 *   retryWithDelay(1000, 3)
 * )
 */
export function retryWithDelay<T>(duration: number, maxTries: number) {
  return retry<T>({
    count: maxTries,
    delay: (error, retryCount) => {
      return timer(duration * (retryCount + 1));
    },
  });
}
