/**
 * A wrapper of an {@link AsyncIterator} that implements many useful methods.
 * Modelled after {@link https://docs.rs/futures/0.3.15/futures/stream/trait.StreamExt.html}.
 */
export class AsyncIter<T> implements AsyncIterator<T>, AsyncIterable<T> {
  #inner: AsyncIterator<T>;

  constructor(inner: AsyncIterator<T>) {
    this.#inner = inner;
  }

  /**
   * Filters elements that pass through the iterator.
   * @param predicate if the item should be included in the resulting iterator.
   * @returns a {@link AsyncIter} where all elements have passed the predicate.
   */
  filter(predicate: (item: T) => Promise<boolean>): AsyncIter<T> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      for await (const item of iter) {
        if (await predicate(item)) yield item;
      }
    }(this));
  }

  /**
   * Filters elements that pass through the iterator.
   * @param predicate if the item should be included in the resulting iterator.
   * @returns a {@link AsyncIter} where all elements have passed the predicate.
   */
  filterSync(predicate: (item: T) => boolean): AsyncIter<T> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      for await (const item of iter) {
        if (predicate(item)) yield item;
      }
    }(this));
  }

  /**
   * Processes all items with the provided function and yields all outputs that were defined
   * @param func the function to map an item that returns an output if it should be yielded or
   * undefined if it shouldn't.
   * @returns a {@link AsyncIter} where all elements have been mapped and filtered through the
   * function.
   */
  filterMap<Output>(
    func: (item: T) => Promise<Output | undefined>,
  ): AsyncIter<Output> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      for await (const item of iter) {
        const mapped = await func(item);
        if (mapped !== undefined) yield mapped;
      }
    }(this));
  }

  /**
   * Processes all items with the provided function and yields all outputs that were defined
   * @param func the function to map an item that returns an output if it should be yielded or
   * undefined if it shouldn't.
   * @returns a {@link AsyncIter} where all elements have been mapped and filtered through the
   * function.
   */
  filterMapSync<Output>(
    func: (item: T) => Output | undefined,
  ): AsyncIter<Output> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      for await (const item of iter) {
        const mapped = func(item);
        if (mapped !== undefined) yield mapped;
      }
    }(this));
  }

  /**
   * Asynchronously maps the items in the iterator with the provided function and then awaits their
   * result. If you would not like to await the resulting promise, use {@method mapSync}.
   * @param func a function to map items.
   * @returns a {@link AsyncIter} where all elements have been mapped by the provided function.
   */
  map<Output>(
    func: (item: T) => Promise<Output>,
  ): AsyncIter<Output> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      for await (const item of iter) {
        yield await func(item);
      }
    }(this));
  }

  /**
   * Synchronously maps the items in the iterator with the provided function. If you would like to
   * await the result and your function returns a {@link Promise}, use {@method map}.
   * @param func a function to map items.
   * @returns a {@link AsyncIter} where all elements have been mapped by the provided function.
   */
  mapSync<Output>(
    func: (item: T) => Output,
  ): AsyncIter<Output> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      for await (const item of iter) {
        yield func(item);
      }
    }(this));
  }

  /**
   * Chains all provided iterables into one {@link AsyncIter}.
   * @param next iterables to be appended onto the current one.
   * @returns all iterables chained onto the current {@link AsyncIter}.
   */
  chain(...next: AsyncIterable<T>[]): AsyncIter<T> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      yield* iter;

      for (const nextIterator of next) {
        yield* nextIterator;
      }
    }(this));
  }

  /**
   * Combines the result of both iterators into one {@link AsyncIter} with items of tuples from the
   * left and right iterator.
   * @param right the iterator to be zipped and have it's values on the right of the resulting
   * iterator.
   * @returns a zipped {@link AsyncIter}
   */
  zip(right: AsyncIterable<T>): AsyncIter<[T, T]> {
    const rightIter = right[Symbol.asyncIterator]();

    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      let done = false;

      while (!done) {
        const [leftResult, rightResult] = await Promise.all([
          iter.next(),
          rightIter.next(),
        ]);

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
   * @returns a {@link AsyncIter} with items and their index.
   */
  enumerate(): AsyncIter<[number, T]> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      let index = 0;

      for await (const item of iter) {
        yield [index++, item] as [number, T];
      }
    }(this));
  }

  /**
   * Creates an iterator with only n number of items.
   * @param limit how many items to limit the iterator to.
   * @returns a limited {@link AsyncIter}.
   */
  take(limit: number): AsyncIter<T> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      let count = 0;

      for await (const item of iter) {
        if (++count > limit) break;
        yield item;
      }
    }(this));
  }

  /**
   * Skips n items in the iterator.
   * @param items the number of items to skip.
   * @returns a {@link AsyncIter} that skipped n elements.
   */
  skip(items: number): AsyncIter<T> {
    return new AsyncIter(async function* (iter: AsyncIter<T>) {
      let count = 0;

      for await (const item of iter) {
        if (++count <= items) continue;
        yield item;
      }
    }(this));
  }

  /**
   * Iterates through the entire iterator and collects the items as an array.
   * @returns all the items in the iterator as an array.
   */
  collect(): Promise<T[]> {
    return this.reduce<T[]>((prev, curr) => [...prev, curr], []);
  }

  /**
   * Iterates through the entire iterator reducing all items to one value.
   * @param func a function executed on each item of the iterator with the previous value supplied.
   * @param initial the initial value to be passed to the reducer function.
   * @returns the iterator reduced down to a single value.
   */
  async reduce<X>(func: (prev: X, item: T) => X, initial: X): Promise<X> {
    let result = initial;

    for await (const item of this) {
      result = func(result, item);
    }

    return result;
  }

  /**
   * @returns the number of items the {@link AsyncIter} will yield.
   */
  async count(): Promise<number> {
    let count = 0;

    for await (const _ of this) {
      count++;
    }

    return count;
  }

  /**
   * Executes the provided function for every item in the iterator.
   * @param func a function that accepts items.
   */
  async forEach(func: (item: T) => void): Promise<void> {
    for await (const item of this) {
      func(item);
    }
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator
   */
  next(): Promise<IteratorResult<T>> {
    return this.#inner.next();
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator
   */
  [Symbol.asyncIterator](): AsyncIterator<T, unknown, undefined> {
    return this;
  }
}
