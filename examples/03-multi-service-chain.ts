/**
 * Chaining typed Results across three async services — each step
 * short-circuits on failure, so the rest of the pipeline never runs.
 *
 * `userService`, `stripe`, and `emailService` are minimal stand-ins for your
 * real services.
 */
import { tryCatchAsync } from 'catchtype'
import type { Result } from 'catchtype'

// --- stand-ins for your real services ---
interface User {
  id: string
  stripeId: string
}
interface Payment {
  id: string
  amount: number
}
declare const userService: { find(id: string): Promise<User> }
declare const stripe: { charge(input: { customer: string; amount: number }): Promise<Payment> }
declare const emailService: { send(input: { template: string; payment: Payment }): Promise<void> }
// ---

type ServiceError =
  | { code: 'USER_NOT_FOUND' }
  | { code: 'PAYMENT_FAILED'; reason: string }
  | { code: 'EMAIL_FAILED'; message: string }

// Each service returns a typed Result instead of throwing
async function getUser(id: string): Promise<Result<User, ServiceError>> {
  return tryCatchAsync(
    () => userService.find(id),
    (): ServiceError => ({ code: 'USER_NOT_FOUND' })
  )
}

async function chargeCard(user: User, amount: number): Promise<Result<Payment, ServiceError>> {
  return tryCatchAsync(
    () => stripe.charge({ customer: user.stripeId, amount }),
    (e): ServiceError => ({
      code: 'PAYMENT_FAILED',
      reason: e instanceof Error ? e.message : 'Card declined',
    })
  )
}

async function sendReceipt(payment: Payment): Promise<Result<void, ServiceError>> {
  return tryCatchAsync(
    () => emailService.send({ template: 'receipt', payment }),
    (e): ServiceError => ({
      code: 'EMAIL_FAILED',
      message: e instanceof Error ? e.message : 'Email failed',
    })
  )
}

// catchtype's chain() composes synchronous Results. Each step below is
// async, so we await and short-circuit manually — the same one-line shape
// repeats for every step in the pipeline.
export async function processOrder(
  userId: string,
  amount: number
): Promise<Result<void, ServiceError>> {
  const userResult = await getUser(userId)
  if (!userResult.ok) return userResult // USER_NOT_FOUND — charge and email never run

  const paymentResult = await chargeCard(userResult.value, amount)
  if (!paymentResult.ok) return paymentResult // PAYMENT_FAILED — email never runs

  return sendReceipt(paymentResult.value)
  // Type: Result<void, ServiceError>
  // Every branch above returns the same ServiceError union, so the caller
  // gets one exhaustive error type no matter which service failed.
}
