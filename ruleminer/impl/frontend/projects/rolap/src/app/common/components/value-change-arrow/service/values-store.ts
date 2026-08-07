import { Injectable } from '@angular/core';

/**
 * Simple key-value in-memory store for values for ValueChangeArrowComponent.
 *
 * It is crucial for the values to be stored outside the components
 * as they will be destroyed and recreated multiple times during table redraw.
 */
@Injectable({
  providedIn: 'any',
})
export class ValuesStore {
  private values: Map<string, number> = new Map();

  public setValue(instanceId: string, value: number) {
    this.values.set(instanceId, value);
  }

  public getValue(instanceId: string): number | undefined {
    return this.values.get(instanceId);
  }
}
