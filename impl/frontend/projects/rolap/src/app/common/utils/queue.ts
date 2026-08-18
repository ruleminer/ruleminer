abstract class IQueue<T> {
  protected items: T[] = [];
  public abstract push(item: T): void;
  public abstract pop(): T | undefined;
  public abstract peek(): T | undefined;
  get size(): number {
    return this.items.length;
  }
}

export class Stack<T> extends IQueue<T> {
  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    if (this.size === 0) {
      return undefined;
    }
    return this.items.splice(-1, 1)[0];
  }

  public override peek(): T | undefined {
    if (this.size === 0) {
      return undefined;
    }
    return this.items[this.size - 1];
  }
}

export class FixedSizeStack<T> extends Stack<T> {
  private _maxSize: number;

  constructor(size: number) {
    super();
    this._maxSize = size;
  }

  public get maxSize(): number {
    return this._maxSize;
  }

  override push(item: T): void {
    if (this.size + 1 === this.maxSize) {
      this.pop();
    }
    super.push(item);
  }
}
