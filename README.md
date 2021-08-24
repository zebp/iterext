# iterext

Approximate ports of
[Rust's Iterator](https://doc.rust-lang.org/stable/std/iter/trait.Iterator.html)
and
[future-rs' StreamExt](https://docs.rs/futures/0.3.15/futures/stream/trait.StreamExt.html)
to TypeScript.

## Example

```ts
import { Iter } from "./mod.ts";

Iter.repeatWith((i) => "A".repeat(i + 1))
  .enumerate()
  .map(([index, value]) => `[${index}] ${value}`)
  .take(100)
  .forEach(console.log);
```
