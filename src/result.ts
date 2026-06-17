import type { Ok, Err, Result } from './types'

/** Construct a success result. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value, error: null } as const
}

/** Construct a failure result. */
export function err<E>(error: E): Err<E> {
  return { ok: false, value: null, error } as const
}

/** Type guard: narrows `Result<T, E>` to `Ok<T>`. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true
}

/** Type guard: narrows `Result<T, E>` to `Err<E>`. */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false
}

/** Unwrap a result or throw — use only at call sites where throwing is acceptable. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value
  throw new Error(`catchtype: unwrap called on Err — ${JSON.stringify(result.error)}`)
}

/** Unwrap with a fallback value instead of throwing. */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}

/** Map over the Ok branch — transforms the value, leaves Err untouched. */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) return ok(fn(result.value))
  return result
}

/** Map over the Err branch — transforms the error, leaves Ok untouched. */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (!result.ok) return err(fn(result.error))
  return result
}

/** Chain Results — if Ok, pass value to fn which returns a new Result (a.k.a. flatMap/andThen). */
export function chain<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  if (result.ok) return fn(result.value)
  return result
}
