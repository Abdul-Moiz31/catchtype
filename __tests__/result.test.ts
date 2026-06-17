import { describe, expect, it } from 'vitest'
import { chain, err, isErr, isOk, map, mapErr, ok, unwrap, unwrapOr } from '../src/result'

describe('ok', () => {
  it('returns { ok: true, value, error: null }', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42, error: null })
  })
})

describe('err', () => {
  it('returns { ok: false, value: null, error }', () => {
    expect(err('boom')).toEqual({ ok: false, value: null, error: 'boom' })
  })
})

describe('isOk', () => {
  it('returns true for ok()', () => {
    expect(isOk(ok(1))).toBe(true)
  })

  it('returns false for err()', () => {
    expect(isOk(err('e'))).toBe(false)
  })
})

describe('isErr', () => {
  it('returns false for ok()', () => {
    expect(isErr(ok(1))).toBe(false)
  })

  it('returns true for err()', () => {
    expect(isErr(err('e'))).toBe(true)
  })
})

describe('unwrap', () => {
  it('returns value from ok()', () => {
    expect(unwrap(ok(42))).toBe(42)
  })

  it('throws for err()', () => {
    expect(() => unwrap(err('boom'))).toThrow(/catchtype: unwrap called on Err/)
  })
})

describe('unwrapOr', () => {
  it('returns value for ok()', () => {
    expect(unwrapOr(ok(42), 0)).toBe(42)
  })

  it('returns fallback for err()', () => {
    expect(unwrapOr(err('boom'), 0)).toBe(0)
  })
})

describe('map', () => {
  it('transforms value on ok()', () => {
    expect(map(ok(2), (x) => x * 2)).toEqual(ok(4))
  })

  it('passes Err through unchanged', () => {
    const input = err('boom')
    expect(map(input, (x: number) => x * 2)).toEqual(input)
  })
})

describe('mapErr', () => {
  it('transforms error on err()', () => {
    expect(mapErr(err('boom'), (e) => e.toUpperCase())).toEqual(err('BOOM'))
  })

  it('passes Ok through unchanged', () => {
    const input = ok(42)
    expect(mapErr(input, (e: string) => e.toUpperCase())).toEqual(input)
  })
})

describe('chain', () => {
  it('calls fn with value on ok()', () => {
    expect(chain(ok(2), (x) => ok(x * 2))).toEqual(ok(4))
  })

  it('passes Err through on err()', () => {
    const input = err('boom')
    expect(chain(input, (x: number) => ok(x * 2))).toEqual(input)
  })
})
