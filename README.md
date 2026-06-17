# catchtype

Typed error handling for TypeScript — discriminated unions, exhaustiveness
checking, zero dependencies.

## The problem

TypeScript 4+ made `catch (e)` give you `unknown`. That was correct — but it
abandoned you there. Most codebases either cast to `any` and pray, or use ten
different ad-hoc error handling styles with no consistency.

Async error handling is consistently one of the most common categories of bug
in real TypeScript codebases. catchtype gives you a small, consistent way to
deal with it:

1. A typed error taxonomy using discriminated unions
2. A `tryCatch` wrapper that returns typed results, never throws
3. Exhaustiveness checking — TypeScript errors if you miss an error case
4. Zero dependencies — feels like vanilla TypeScript

## Install

```bash
npm install catchtype
```

## Quick start

```ts
import { tryCatch, match, exhaustive } from 'catchtype'
import type { CatchtypeError } from 'catchtype'

type ParseError = CatchtypeError<'INVALID_JSON'>

function parseJson(input: string) {
  return tryCatch<unknown, ParseError>(
    () => JSON.parse(input),
    (e) => ({ code: 'INVALID_JSON', message: e instanceof Error ? e.message : 'parse failed' })
  )
}

const result = parseJson('{ not valid json')

const response = match(result, {
  ok: (value) => ({ status: 200, body: value }),
  err: (error) => ({ status: 400, body: error.message }),
})
```

## Defining an error taxonomy

Extend `CatchtypeError` to model the specific failure modes of a function as a
discriminated union:

```ts
import type { CatchtypeError } from 'catchtype'

type DbError =
  | (CatchtypeError<'NOT_FOUND'> & { id: string })
  | (CatchtypeError<'TIMEOUT'> & { ms: number })
  | CatchtypeError<'FORBIDDEN'>
```

Then handle every case explicitly, and let `exhaustive()` catch the ones you
forgot:

```ts
import { exhaustive } from 'catchtype'

switch (error.code) {
  case 'NOT_FOUND':
    return `404: no record with id ${error.id}`
  case 'TIMEOUT':
    return `408: timed out after ${error.ms}ms`
  case 'FORBIDDEN':
    return '403: forbidden'
  default:
    return exhaustive(error)
    // Add a new member to DbError and forget to handle it here?
    // TypeScript errors at compile time, not 2am in production.
}
```

## API

### `Result<T, E>`

```ts
type Result<T, E> = Ok<T> | Err<E>
```

The discriminated union every catchtype-wrapped function returns instead of
throwing.

### `ok(value)` / `err(error)`

Construct an `Ok<T>` or `Err<E>` directly.

### `isOk(result)` / `isErr(result)`

Type guards that narrow a `Result<T, E>` to `Ok<T>` or `Err<E>`.

### `unwrap(result)` / `unwrapOr(result, fallback)`

Escape hatches for pulling a value out of a `Result` — `unwrap` throws on
`Err`, `unwrapOr` returns a fallback instead.

### `map(result, fn)` / `mapErr(result, fn)` / `chain(result, fn)`

Transform the `Ok` value, transform the `Err` value, or chain another
`Result`-returning function — each leaves the other branch untouched.

### `tryCatch(fn, onError)` / `tryCatchAsync(fn, onError)`

Wrap a throwing function (or one returning a `Promise`) and convert whatever
it throws into your own typed error via `onError`.

### `tryCatchUnknown(fn)` / `tryCatchUnknownAsync(fn)`

Same as above, but skips the mapper and wraps the caught value in a built-in
`UnknownError` shape — useful when you don't (yet) have a typed taxonomy for
that call site.

### `match(result, { ok, err })`

Functional alternative to branching on `result.ok` — both handlers are
required, so neither branch can be silently skipped.

### `exhaustive(value)`

Pass the value of a discriminated union here once every case has been
handled. If TypeScript can prove all cases are covered, `value` narrows to
`never` and the call type-checks. If a case is missing, TypeScript errors at
compile time. At runtime it throws — a defensive backstop that should never
actually fire.

## Design notes

- **No throwing, except at the edges.** `tryCatch` and `tryCatchAsync` never
  throw — they always return a `Result`. `unwrap` is the one function that
  throws by design, for call sites where you've decided a failure should
  propagate as an exception.
- **`error` and `value` are mutually exclusive and always present.** `Ok<T>`
  has `error: null`, `Err<E>` has `value: null` — so destructuring either
  field works without an `in` check first.
- **No fp-ts, no `Either`, no pipe operators.** catchtype is a few small
  functions, not a functional programming runtime. If you want one, fp-ts is
  right there.

## License

MIT
