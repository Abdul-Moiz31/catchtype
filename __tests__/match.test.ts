import { describe, expect, it } from 'vitest'
import { err, ok } from '../src/result'
import { match } from '../src/match'

describe('match', () => {
  it('calls ok handler for ok() result, returns its value', () => {
    const result = match(ok(42), {
      ok: (value) => value * 2,
      err: () => -1,
    })
    expect(result).toBe(84)
  })

  it('calls err handler for err() result, returns its value', () => {
    const result = match(err('boom'), {
      ok: () => 'unreachable',
      err: (error) => `handled: ${error}`,
    })
    expect(result).toBe('handled: boom')
  })

  it('supports async handlers — the return type is inferred as a Promise', async () => {
    const pending: Promise<string> = match(ok(42), {
      ok: (value) => Promise.resolve(`value is ${value}`),
      err: (error) => Promise.resolve(`error is ${error}`),
    })
    await expect(pending).resolves.toBe('value is 42')
  })
})
