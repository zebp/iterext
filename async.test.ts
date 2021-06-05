import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { AsyncIter } from "./async.ts";

async function* sequentialIntegers(start: number = 1, end: number = 10) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

Deno.test({
  name: "create async iter",
  fn() {
    new AsyncIter(sequentialIntegers());
  },
});

Deno.test({
  name: "is valid iterator",
  async fn() {
    assertEquals(await new AsyncIter(sequentialIntegers()).next(), {
      done: false,
      value: 1,
    });
  },
});

Deno.test({
  name: "is valid iterable",
  async fn() {
    for await (const item of new AsyncIter(sequentialIntegers())) {
      assertEquals(item, 1);
      break;
    }
  },
});

Deno.test({
  name: "collect iter",
  async fn() {
    const items = await new AsyncIter(sequentialIntegers()).collect();

    assertEquals(items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  },
});

Deno.test({
  name: "reduce iter",
  async fn() {
    const tenFactorial = await new AsyncIter(sequentialIntegers(1, 10)).reduce(
      (prev, item) => prev * item,
      1,
    );

    assertEquals(tenFactorial, 3628800);
  },
});

Deno.test({
  name: "filter iter",
  async fn() {
    const evenNumbers = await new AsyncIter(sequentialIntegers(1, 10)).filter(
      async (
        x,
      ) => x % 2 == 0,
    ).collect();

    assertEquals(evenNumbers, [2, 4, 6, 8, 10]);
  },
});

Deno.test({
  name: "filterSync iter",
  async fn() {
    const evenNumbers = await new AsyncIter(sequentialIntegers(1, 10))
      .filterSync((
        x,
      ) => x % 2 == 0).collect();

    assertEquals(evenNumbers, [2, 4, 6, 8, 10]);
  },
});

Deno.test({
  name: "map iter",
  async fn() {
    const result = await new AsyncIter(sequentialIntegers(1, 10)).map(
      async (
        x,
      ) => x * 2,
    ).collect();

    assertEquals(result, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  },
});

Deno.test({
  name: "mapSync iter",
  async fn() {
    const result = await new AsyncIter(sequentialIntegers(1, 10)).mapSync((
      x,
    ) => x * 2).collect();

    assertEquals(result, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  },
});

Deno.test({
  name: "filterMap iter",
  async fn() {
    const result = await new AsyncIter(sequentialIntegers(1, 10))
      .filterMap(
        async (
          x,
        ) => {
          return x % 2 == 0 ? undefined : x * 2;
        },
      ).collect();

    assertEquals(result, [2, 6, 10, 14, 18]);
  },
});

Deno.test({
  name: "filterMapSync iter",
  async fn() {
    const result = await new AsyncIter(sequentialIntegers(1, 10))
      .filterMapSync(
        (
          x,
        ) => {
          return x % 2 == 0 ? undefined : x * 2;
        },
      ).collect();

    assertEquals(result, [2, 6, 10, 14, 18]);
  },
});

Deno.test({
  name: "chain iter",
  async fn() {
    const chained = new AsyncIter(sequentialIntegers(1, 5)).chain(
      sequentialIntegers(6, 8),
      sequentialIntegers(9, 10),
    );

    assertEquals(await chained.collect(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  },
});

Deno.test({
  name: "zip iter",
  async fn() {
    const zipped = new AsyncIter(sequentialIntegers(1, 5)).zip(
      sequentialIntegers(6, 10),
    );

    assertEquals(await zipped.collect(), [
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
  async fn() {
    const enumerated = new AsyncIter(sequentialIntegers(1, 5)).enumerate();

    assertEquals(await enumerated.collect(), [
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
  async fn() {
    const firstTwenty = await new AsyncIter(sequentialIntegers(1, Infinity))
      .take(20).collect();

    assertEquals(firstTwenty.length, 20);
  },
});

Deno.test({
  name: "skip iter",
  async fn() {
    const after5 = await new AsyncIter(sequentialIntegers(1, 10))
      .skip(5).collect();

    assertEquals(after5, [6, 7, 8, 9, 10]);
  },
});

Deno.test({
  name: "count iter",
  async fn() {
    assertEquals(
      await new AsyncIter(sequentialIntegers(1, 10))
        .count(),
      10,
    );
  },
});

Deno.test({
  name: "forEach iter",
  async fn() {
    let callCount = 0;

    await new AsyncIter(sequentialIntegers(1, 10))
      .forEach(() => callCount++);

    assertEquals(
      callCount,
      10,
    );
  },
});
