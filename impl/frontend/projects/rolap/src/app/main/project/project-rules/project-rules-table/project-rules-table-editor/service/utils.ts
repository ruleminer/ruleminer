import { FixedSizeStack } from 'projects/rolap/src/app/common/utils/queue';

export class StateHistory<T> {
  private undoStack: FixedSizeStack<T>;
  private redoStack: FixedSizeStack<T>;

  constructor(private maxSize: number) {
    this.undoStack = new FixedSizeStack<T>(this.maxSize);
    this.redoStack = new FixedSizeStack<T>(this.maxSize);
  }

  public push(state: T) {
    this.undoStack.push(state);
  }

  public peek(): T | undefined {
    return this.undoStack.peek();
  }

  public modify(state: T) {
    this.undoStack.pop();
    this.undoStack.push(state);
  }

  public undo(): T {
    if (!this.canUndo()) throw new Error('Nothing to undo - history is empty');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const state = this.undoStack.pop()!;
    this.redoStack.push(state);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.undoStack.peek()!;
  }

  public redo(): T {
    if (!this.canRedo()) throw new Error('Nothing to redo - history is empty');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const state = this.redoStack.pop()!;
    this.undoStack.push(state);
    return state;
  }

  public canRedo(): boolean {
    return this.redoStack.size > 0;
  }

  public canUndo(): boolean {
    return this.undoStack.size > 1;
  }

  public canModify(): boolean {
    return this.undoStack.size > 0;
  }
}
