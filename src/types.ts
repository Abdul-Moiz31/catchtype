/** A successful result, holding the value produced by an operation. */
export interface Ok<T> {
  readonly ok: true
  readonly value: T
  readonly error: null
}

/** A failed result, holding the typed error produced by an operation. */
export interface Err<E> {
  readonly ok: false
  readonly value: null
  readonly error: E
}

/** The union of {@link Ok} and {@link Err} — what every catchtype-wrapped function returns. */
export type Result<T, E> = Ok<T> | Err<E>

/**
 * Base type for user-defined error taxonomies. Extend this to define your own
 * error shapes, e.g. `type DbError = CatchtypeError<'DB_NOT_FOUND'> & { query: string }`.
 */
export interface CatchtypeError<TCode extends string = string> {
  readonly code: TCode
  readonly message: string
}

/** Error shape used to wrap values caught from an unknown `catch` clause. */
export interface UnknownError extends CatchtypeError<'UNKNOWN'> {
  readonly code: 'UNKNOWN'
  readonly message: string
  readonly cause: unknown
}
