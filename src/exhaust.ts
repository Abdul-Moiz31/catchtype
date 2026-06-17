/**
 * Receives the value of a discriminated union after all known cases have
 * been handled. If TypeScript is satisfied that all cases are covered, the
 * argument type is narrowed to `never`. If a case is missing, TypeScript
 * errors at compile time. At runtime, this throws if somehow called.
 */
export function exhaustive(value: never, message?: string): never {
  throw new Error(message ?? `catchtype: exhaustive() reached with value: ${JSON.stringify(value)}`)
}

// Usage example:
//
// type AppError =
//   | { code: 'NOT_FOUND'; id: string }
//   | { code: 'FORBIDDEN'; userId: string }
//   | { code: 'TIMEOUT' }
//
// switch (result.error.code) {
//   case 'NOT_FOUND':  return '404'
//   case 'FORBIDDEN':  return '403'
//   case 'TIMEOUT':    return '408'
//   default: return exhaustive(result.error)
//   // TypeScript errors here if you add a new error code and forget this switch
// }
