import type { Result } from './types'

/**
 * Functional alternative to if/switch on a Result. Both branches must be
 * handled — TypeScript enforces this.
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U
    err: (error: E) => U
  }
): U {
  if (result.ok) return handlers.ok(result.value)
  return handlers.err(result.error)
}

// Usage example:
//
// const response = match(result, {
//   ok:  (user)  => ({ status: 200, body: user }),
//   err: (error) => ({ status: 500, body: error.message }),
// })
