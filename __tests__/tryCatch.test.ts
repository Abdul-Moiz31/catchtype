import { describe, expect, it, vi } from 'vitest'
import { tryCatch, tryCatchAsync, tryCatchUnknown, tryCatchUnknownAsync } from '../src/tryCatch'

describe('tryCatch', () => {
  it('returns ok() when fn does not throw', () => {
    const result = tryCatch(
      () => 42,
      () => 'mapped'
    )
    expect(result).toEqual({ ok: true, value: 42, error: null })
  })

  it('returns err(onError(e)) when fn throws Error', () => {
    const onError = vi.fn((e: unknown) => (e instanceof Error ? e.message : 'unknown'))
    const result = tryCatch(() => {
      throw new Error('boom')
    }, onError)
    expect(result).toEqual({ ok: false, value: null, error: 'boom' })
  })

  it('returns err(onError(e)) when fn throws a string', () => {
    const onError = (e: unknown) => `caught: ${e}`
    const result = tryCatch(() => {
      throw 'oops'
    }, onError)
    expect(result).toEqual({ ok: false, value: null, error: 'caught: oops' })
  })

  it('passes the caught value to onError', () => {
    const onError = vi.fn(() => 'mapped')
    const thrown = new Error('specific')
    tryCatch(() => {
      throw thrown
    }, onError)
    expect(onError).toHaveBeenCalledWith(thrown)
  })
})

describe('tryCatchAsync', () => {
  it('returns ok() when fn resolves', async () => {
    const result = await tryCatchAsync(
      () => Promise.resolve(42),
      () => 'mapped'
    )
    expect(result).toEqual({ ok: true, value: 42, error: null })
  })

  it('returns err() when fn rejects', async () => {
    const result = await tryCatchAsync(
      () => Promise.reject(new Error('boom')),
      (e) => (e instanceof Error ? e.message : 'unknown')
    )
    expect(result).toEqual({ ok: false, value: null, error: 'boom' })
  })
})

describe('tryCatchUnknown', () => {
  it('wraps thrown Error in UnknownError shape', () => {
    const thrown = new Error('boom')
    const result = tryCatchUnknown(() => {
      throw thrown
    })
    expect(result).toEqual({
      ok: false,
      value: null,
      error: { code: 'UNKNOWN', message: 'boom', cause: thrown },
    })
  })

  it('wraps thrown string in UnknownError shape', () => {
    const result = tryCatchUnknown(() => {
      throw 'oops'
    })
    expect(result).toEqual({
      ok: false,
      value: null,
      error: { code: 'UNKNOWN', message: 'oops', cause: 'oops' },
    })
  })
})

describe('tryCatchUnknownAsync', () => {
  it('wraps rejected Promise in UnknownError', async () => {
    const thrown = new Error('async boom')
    const result = await tryCatchUnknownAsync(() => Promise.reject(thrown))
    expect(result).toEqual({
      ok: false,
      value: null,
      error: { code: 'UNKNOWN', message: 'async boom', cause: thrown },
    })
  })
})
