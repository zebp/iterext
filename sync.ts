export class Iter<T> implements Iterator<T>, Iterable<T> {
  #inner: Iterator<T>;

  constructor(inner: Iterator<T>) {
    this.#inner = inner;
  }

  /**
   * Creates a never ending iterator with values from the provided function's output.
   * @param func a function responsible for populating the string.
   * @returns a never ending {@link Iter}.
   */
  static repeatWith<T>(func: (index: number) => T): Iter<T> {
    return new Iter(function* () {
      let index = 0;

      while (true) {
        yield func(index++);
      }
    }());
  }

  /**
   * Filters elements that pass through the iterator.
   * @param predicate if the item should be included in the resulting iterator.
   * @returns a {@link Iter} where all elements have passed the predicate.
   */
  filter(predicate: (item: T) => boolean): Iter<T> {
    return new Iter(function* (iter: Iter<T>) {
      for (const item of iter) {
        if (predicate(item)) yield item;
      }
    }(this));
  }

  /**
   * Processes all items with the provided function and yields all outputs that were defined
   * @param func the function to map an item that returns an output if it should be yielded or
   * undefined if it shouldn't.
   * @returns a {@link Iter} where all elements have been mapped and filtered through the
   * function.
   */
  filterMap<Output>(
    func: (item: T) => Output | undefined,
  ): Iter<Output> {
    return new Iter(function* (iter: Iter<T>) {
      for (const item of iter) {
        const mapped = func(item);
        if (mapped !== undefined) yield mapped;
      }
    }(this));
  }

  /**
   * Maps the items in the iterator with the provided function.
   * @param func a function to map items.
   * @returns a {@link Iter} where all elements have been mapped by the provided function.
   */
  map<Output>(
    func: (item: T) => Output,
  ): Iter<Output> {
    return new Iter(function* (iter: Iter<T>) {
      for (const item of iter) {
        yield func(item);
      }
    }(this));
  }

  /**
   * Chains all provided iterables into one {@link Iter}.
   * @param next iterables to be appended onto the current one.
   * @returns all iterables chained onto the current {@link Iter}.
   */
  chain(...next: Iterable<T>[]): Iter<T> {
    return new Iter(function* (iter: Iter<T>) {
      yield* iter;

      for (const nextIterator of next) {
        yield* nextIterator;
      }
    }(this));
  }

  /**
   * Combines the result of both iterators into one {@link Iter} with items of tuples from the
   * left and right iterator.
   * @param right the iterator to be zipped and have it's values on the right of the resulting
   * iterator.
   * @returns a zipped {@link Iter}
   */
  zip(right: Iterable<T>): Iter<[T, T]> {
    const rightIter = right[Symbol.iterator]();

    return new Iter(function* (iter: Iter<T>) {
      let done = false;

      while (!done) {
        const [leftResult, rightResult] = [
          iter.next(),
          rightIter.next(),
        ];

        // According to MDN docs done is always present, so we'll just fallback to true.
        done ||= leftResult.done ?? true;
        done ||= rightResult.done ?? true;

        if (done) break;

        yield [
          leftResult.value,
          rightResult.value,
        ] as [T, T];
      }
    }(this));
  }

  /**
   * Tags every item in the iterator with it's index.
   * @returns a {@link Iter} with items and their index.
   */
  enumerate(): Iter<[number, T]> {
    return new Iter(function* (iter: Iter<T>) {
      let index = 0;

      for (const item of iter) {
        yield [index++, item] as [number, T];
      }
    }(this));
  }

  /**
   * Creates an iterator with only n number of items.
   * @param limit how many items to limit the iterator to.
   * @returns a limited {@link Iter}.
   */
  take(limit: number): Iter<T> {
    return new Iter(function* (iter: Iter<T>) {
      let count = 0;

      for (const item of iter) {
        if (++count > limit) break;
        yield item;
      }
    }(this));
  }

  /**
   * Skips n items in the iterator.
   * @param items the number of items to skip.
   * @returns a {@link Iter} that skipped n elements.
   */
  skip(items: number): Iter<T> {
    return new Iter(function* (iter: Iter<T>) {
      let count = 0;

      for (const item of iter) {
        if (++count <= items) continue;
        yield item;
      }
    }(this));
  }

  /**
   * Flattens the iterator of elements by one level.
   * @returns a {@link Iter} that yields all items in arrays yielded by the iterator.
   */
  flat<A extends Array<E>, E>(
    this: Iter<A>,
  ): Iter<A extends (infer U)[] ? U : never> {
    return new Iter(function* (iter: Iter<A>) {
      for (const item of iter) {
        yield* item as unknown as any;
      }
    }(this));
  }

  /**
   * Iterates through the entire iterator and collects the items as an array.
   * @returns all the items in the iterator as an array.
   */
  collect(): T[] {
    return this.reduce<T[]>((prev, curr) => [...prev, curr], []);
  }

  /**
   * Iterates through the entire iterator reducing all items to one value.
   * @param func a function executed on each item of the iterator with the previous value supplied.
   * @param initial the initial value to be passed to the reducer function.
   * @returns the iterator reduced down to a single value.
   */
  reduce<X>(func: (prev: X, item: T) => X, initial: X): X {
    let result = initial;

    for (const item of this) {
      result = func(result, item);
    }

    return result;
  }

  /**
   * @returns the number of items the {@link Iter} will yield.
   */
  count(): number {
    let count = 0;

    for (const _ of this) {
      count++;
    }

    return count;
  }

  /**
   * Executes the provided function for every item in the iterator.
   * @param func a function that accepts items.
   */
  forEach(func: (item: T) => void): void {
    for (const item of this) {
      func(item);
    }
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator
   */
  next(): IteratorResult<T> {
    return this.#inner.next();
  }
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator
   */
  [Symbol.iterator](): Iterator<T, unknown, undefined> {
    return this;
  }
}
