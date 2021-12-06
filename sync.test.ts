import { assertEquals, assert } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { Iter } from "./sync.ts";

function* sequentialIntegers(start = 1, end = 10) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

Deno.test({
  name: "create iter",
  fn() {
    new Iter(sequentialIntegers());
  },
});

Deno.test({
  name: "is valid iterator",
  fn() {
    assertEquals(new Iter(sequentialIntegers()).next(), {
      done: false,
      value: 1,
    });
  },
});

Deno.test({
  name: "is valid iterable",
  fn() {
    for (const item of new Iter(sequentialIntegers())) {
      assertEquals(item, 1);
      break;
    }
  },
});

Deno.test({
  name: "flat iter",
  fn() {
    const items = Iter.repeatWith(() => [1, 2]).take(2).flat().collect();

    assertEquals(items, [1, 2, 1, 2]);
  },
});

Deno.test({
  name: "collect iter",
  fn() {
    const items = new Iter(sequentialIntegers()).collect();

    assertEquals(items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  },
});

Deno.test({
  name: "reduce iter",
  fn() {
    const tenFactorial = new Iter(sequentialIntegers(1, 10)).reduce(
      (prev, item) => prev * item,
      1,
    );

    assertEquals(tenFactorial, 3628800);
  },
});

Deno.test({
  name: "filter iter",
  fn() {
    const evenNumbers = new Iter(sequentialIntegers(1, 10)).filter(
      (x) => x % 2 == 0,
    ).collect();

    assertEquals(evenNumbers, [2, 4, 6, 8, 10]);
  },
});

Deno.test({
  name: "map iter",
  fn() {
    const result = new Iter(sequentialIntegers(1, 10)).map(
      (x) => x * 2,
    ).collect();

    assertEquals(result, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  },
});

Deno.test({
  name: "filterMap iter",
  fn() {
    const result = new Iter(sequentialIntegers(1, 10))
      .filterMap(
        (x) => x % 2 == 0 ? undefined : x * 2,
      ).collect();

    assertEquals(result, [2, 6, 10, 14, 18]);
  },
});

Deno.test({
  name: "chain iter",
  fn() {
    const chained = new Iter(sequentialIntegers(1, 5)).chain(
      sequentialIntegers(6, 8),
      sequentialIntegers(9, 10),
    );

    assertEquals(chained.collect(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  },
});

Deno.test({
  name: "zip iter",
  fn() {
    const zipped = new Iter(sequentialIntegers(1, 5)).zip(
      sequentialIntegers(6, 10),
    );

    assertEquals(zipped.collect(), [
      [1, 6],
      [2, 7],
      [3, 8],
      [4, 9],
      [5, 10],
    ]);
  },
});

Deno.test({
  name: "enumerate iter",
  fn() {
    const enumerated = new Iter(sequentialIntegers(1, 5)).enumerate();

    assertEquals(enumerated.collect(), [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ]);
  },
});

Deno.test({
  name: "take iter",
  fn() {
    const firstTwenty = new Iter(sequentialIntegers(1, Infinity))
      .take(20).collect();

    assertEquals(firstTwenty.length, 20);
  },
});

Deno.test({
  name: "skip iter",
  fn() {
    const after5 = new Iter(sequentialIntegers(1, 10))
      .skip(5).collect();

    assertEquals(after5, [6, 7, 8, 9, 10]);
  },
});

Deno.test({
  name: "count iter",
  fn() {
    assertEquals(
      new Iter(sequentialIntegers(1, 10))
        .count(),
      10,
    );
  },
});

Deno.test({
  name: "forEach iter",
  fn() {
    let callCount = 0;

    new Iter(sequentialIntegers(1, 10))
      .forEach(() => callCount++);

    assertEquals(
      callCount,
      10,
    );
  },
});
