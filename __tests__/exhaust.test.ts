import { describe, expect, it } from 'vitest'
import { exhaustive } from '../src/exhaust'

describe('exhaustive', () => {
  it('throws at runtime when called', () => {
    // Cast bypasses the compile-time `never` check — here we only verify the runtime guard.
    expect(() => exhaustive('UNREACHABLE' as never)).toThrow(/catchtype: exhaustive/)
  })

  it('demonstrates the compile-time error for an unhandled union case', () => {
    type Status = 'PENDING' | 'DONE'
    const status: Status = 'PENDING'

    switch (status) {
      case 'PENDING':
        break
      // 'DONE' is intentionally left unhandled to prove exhaustiveness checking works.
      default: {
        // @ts-expect-error — because the 'DONE' case above is never handled, `status`
        // narrows to 'DONE' (not `never`) in this branch. exhaustive() only accepts
        // `never`, so TypeScript rejects this call at compile time — exactly the
        // behavior that catches a forgotten switch case. At runtime this branch is
        // unreachable since `status` is 'PENDING', so exhaustive() never actually fires.
        exhaustive(status)
      }
    }

    expect(status).toBe('PENDING')
  })
})
