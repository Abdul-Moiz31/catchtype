/**
 * Express API route — typed DB and Auth errors with exhaustiveness checking.
 *
 * `app`, `db`, and `User` are minimal stand-ins for your real Express app,
 * database client, and user model — swap them for the real things. The
 * catchtype usage (tryCatchAsync, ok/err, match, exhaustive) is the point.
 */
import { tryCatchAsync, ok, err, match, exhaustive } from 'catchtype'
import type { Result } from 'catchtype'

// --- stand-ins for your real Express app, db client, and user model ---
interface User {
  id: string
  active: boolean
  permissions: string[]
}
interface Request {
  params: { id: string }
}
interface Response {
  status(code: number): { json(body: unknown): void }
}
declare const app: {
  get(path: string, handler: (req: Request, res: Response) => unknown): void
}
declare const db: {
  users: { findOne(query: { id: string }): Promise<User> }
}
// ---

// Define your error taxonomy once for the whole service. Each member is a
// distinct type — a real discriminated union, not a single shape with a
// union-typed `code` — so switch + exhaustive() can narrow on it below.
type DbError =
  | { code: 'DB_NOT_FOUND'; message: string }
  | { code: 'DB_TIMEOUT'; message: string }
  | { code: 'DB_CONSTRAINT'; message: string }

type AuthError =
  | { code: 'UNAUTHORIZED'; message: string }
  | { code: 'FORBIDDEN'; message: string }

// The union of errors this route can return, end to end
type AppError = DbError | AuthError

// Repository functions return Result, never throw
async function findUser(id: string): Promise<Result<User, DbError>> {
  return tryCatchAsync(
    () => db.users.findOne({ id }),
    (e): DbError => ({
      code: 'DB_NOT_FOUND',
      message: e instanceof Error ? e.message : 'User not found',
    })
  )
}

function authorize(user: User, resource: string): Result<User, AuthError> {
  if (!user.active) return err({ code: 'UNAUTHORIZED', message: 'Account inactive' })
  if (!user.permissions.includes(resource)) {
    return err({ code: 'FORBIDDEN', message: `No access to ${resource}` })
  }
  return ok(user)
}

// The route handler — every error case typed and handled
app.get('/users/:id/orders', async (req, res) => {
  const userResult = await findUser(req.params.id)
  if (!userResult.ok) {
    // Already narrowed to Err<DbError> here — no need to re-branch with match
    return res.status(userResult.error.code === 'DB_NOT_FOUND' ? 404 : 503).json(userResult.error)
  }

  const authResult = authorize(userResult.value, 'orders:read')

  match(authResult, {
    ok: (user) => res.status(200).json({ userId: user.id, orders: [] }),
    err: (e) => {
      switch (e.code) {
        case 'UNAUTHORIZED': return res.status(401).json(e)
        case 'FORBIDDEN': return res.status(403).json(e)
        default: return exhaustive(e)
        // Add a new AuthError code? TypeScript forces you to handle it here.
      }
    },
  })
})
