import { ok, err } from './result'
import type { Result, UnknownError } from './types'

function toUnknownError(cause: unknown): UnknownError {
  const message =
    cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : 'An unknown error occurred'
  return { code: 'UNKNOWN', message, cause }
}

/** Sync version — wraps a function that might throw. The mapper converts caught values into your typed error. */
export function tryCatch<T, E>(fn: () => T, onError: (caught: unknown) => E): Result<T, E> {
  try {
    return ok(fn())
  } catch (e) {
    return err(onError(e))
  }
}

/** Async version — wraps a function returning a Promise. */
export async function tryCatchAsync<T, E>(
  fn: () => Promise<T>,
  onError: (caught: unknown) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn())
  } catch (e) {
    return err(onError(e))
  }
}

/** Convenience version: no mapper needed — wraps in UnknownError automatically. */
export function tryCatchUnknown<T>(fn: () => T): Result<T, UnknownError> {
  return tryCatch(fn, toUnknownError)
}

/** Async convenience version: no mapper needed — wraps in UnknownError automatically. */
export async function tryCatchUnknownAsync<T>(fn: () => Promise<T>): Promise<Result<T, UnknownError>> {
  return tryCatchAsync(fn, toUnknownError)
}
