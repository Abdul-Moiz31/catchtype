'use server'

/**
 * Next.js Server Action — typed error responses instead of thrown exceptions.
 *
 * `getSession`, `ProfileSchema`, and `db` are minimal stand-ins for your real
 * auth helper, validation schema, and database client.
 */
import { tryCatchAsync, err, match, exhaustive } from 'catchtype'
import type { Result } from 'catchtype'

// --- stand-ins for your real session helper, schema, and db client ---
declare const getSession: () => Promise<{ userId: string } | null>
declare const ProfileSchema: {
  safeParse(data: unknown):
    | { success: true; data: { name: string; bio: string } }
    | { success: false; error: { issues: { path: (string | number)[] }[] } }
}
declare const db: {
  users: {
    update(input: { id: string; name: string; bio: string }): Promise<{ success: true }>
  }
}
// ---

type UpdateError =
  | { code: 'VALIDATION_ERROR'; fields: string[] }
  | { code: 'UNAUTHORIZED' }
  | { code: 'DB_ERROR'; message: string }

export async function updateProfile(
  formData: FormData
): Promise<Result<{ success: true }, UpdateError>> {
  const session = await getSession()
  if (!session) return err({ code: 'UNAUTHORIZED' })

  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return err({
      code: 'VALIDATION_ERROR',
      fields: parsed.error.issues.map((issue) => issue.path.join('.')),
    })
  }

  return tryCatchAsync(
    () => db.users.update({ id: session.userId, ...parsed.data }),
    (e): UpdateError => ({
      code: 'DB_ERROR',
      message: e instanceof Error ? e.message : 'Database error',
    })
  )
}

// --- usage from a client component, e.g. a form's onSubmit handler ---
// (this part would live in a separate 'use client' file in a real app)
declare const toast: { success(message: string): void; error(message: string): void }
declare const router: { push(path: string): void }
declare function setErrors(fields: string[]): void

async function handleProfileSubmit(formData: FormData) {
  const result = await updateProfile(formData)

  match(result, {
    ok: () => toast.success('Profile updated'),
    err: (error) => {
      switch (error.code) {
        case 'VALIDATION_ERROR': return setErrors(error.fields)
        case 'UNAUTHORIZED': return router.push('/login')
        case 'DB_ERROR': return toast.error(error.message)
        default: return exhaustive(error)
        // TypeScript errors here if UpdateError grows a new case
      }
    },
  })
}
