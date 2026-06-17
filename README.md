# catchtype

Typed error handling for TypeScript. Discriminated unions, exhaustiveness
checking, zero dependencies. No fp-ts. No category theory. Just TypeScript.

## Install

```bash
npm install catchtype
# or
pnpm add catchtype
```

## The problem

TypeScript 4+ made catch(e) give you unknown. Correct. But then what?

```typescript
try {
  const user = await getUser(id)
} catch (e) {
  // e is unknown. You have no idea what it is.
  // Most codebases do this:
  console.error((e as any).message) // lies
}
```

## The solution

Define your error taxonomy once. TypeScript enforces you handle every case.

```typescript
import { tryCatchAsync, ok, err, match, exhaustive } from 'catchtype'

// 1. Define your error types
type DbError   = { code: 'DB_NOT_FOUND' | 'DB_TIMEOUT'; message: string }
type AuthError = { code: 'UNAUTHORIZED' | 'FORBIDDEN';  message: string }

// 2. Return Results instead of throwing
async function getUser(id: string) {
  return tryCatchAsync(
    () => db.users.findOne(id),
    (e): DbError => ({
      code:    'DB_NOT_FOUND',
      message: e instanceof Error ? e.message : 'User not found',
    })
  )
}

// 3. The caller handles both branches — TypeScript enforces this
const result = await getUser(userId)

match(result, {
  ok:  (user)  => console.log(user.name),
  err: (error) => {
    switch (error.code) {
      case 'DB_NOT_FOUND': return sendNotFound()
      case 'DB_TIMEOUT':   return sendRetry()
      default: return exhaustive(error)
      // TypeScript errors if you add a new code and forget this switch
    }
  }
})
```

## API

### Core types

```typescript
type Result<T, E> = Ok<T> | Err<E>

interface Ok<T>  { ok: true;  value: T; error: null }
interface Err<E> { ok: false; value: null; error: E }
```

### Constructors

```typescript
ok(value)   // → Ok<T>
err(error)  // → Err<E>
```

### Wrappers

```typescript
tryCatch(fn, onError)          // sync,  returns Result<T, E>
tryCatchAsync(fn, onError)     // async, returns Promise<Result<T, E>>
tryCatchUnknown(fn)            // sync,  wraps in UnknownError
tryCatchUnknownAsync(fn)       // async, wraps in UnknownError
```

### Utilities

```typescript
isOk(result)              // type guard → result is Ok<T>
isErr(result)             // type guard → result is Err<E>
unwrap(result)            // returns value or throws
unwrapOr(result, fallback)// returns value or fallback
map(result, fn)           // transform Ok value
mapErr(result, fn)        // transform Err error
chain(result, fn)         // flatMap — fn returns a new Result
match(result, { ok, err })// handle both branches, must return same type
exhaustive(value)         // compile error if any case is unhandled
```

## Real-world patterns

### Multiple error types in one function

```typescript
type AppError = DbError | AuthError | NetworkError

async function processOrder(
  userId: string,
  orderId: string
): Promise<Result<Order, AppError>> {
  const userResult = await getUser(userId)
  if (!userResult.ok) return userResult  // DbError passes through

  const authResult = checkPermission(userResult.value, orderId)
  if (!authResult.ok) return authResult  // AuthError passes through

  return fetchOrder(orderId)
}
```

### Chaining Results

```typescript
import { chain } from 'catchtype'

const result = await getUser(id)
const orderResult = chain(result, (user) => getOrder(user.activeOrderId))
// orderResult is Result<Order, DbError>
// If getUser failed, getOrder is never called
```

### Express error middleware

```typescript
app.get('/users/:id', async (req, res) => {
  const result = await getUser(req.params.id)

  match(result, {
    ok:  (user)  => res.json(user),
    err: (error) => {
      switch (error.code) {
        case 'DB_NOT_FOUND': return res.status(404).json(error)
        case 'DB_TIMEOUT':   return res.status(503).json(error)
        case 'UNAUTHORIZED': return res.status(401).json(error)
        case 'FORBIDDEN':    return res.status(403).json(error)
        default: return exhaustive(error)
      }
    }
  })
})
```

## Why not neverthrow?

neverthrow is good but its API is built around method chaining on a class
instance, which many teams find unfamiliar. catchtype uses plain functions
and plain objects — it reads like TypeScript, not Haskell.

## License

MIT
