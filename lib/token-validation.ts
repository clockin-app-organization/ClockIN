import { createAdminClient } from '@/lib/supabase/admin'
import type { TokenPayload } from '@/lib/types'
import type { PostgrestError } from '@supabase/supabase-js'

type ValidationError = PostgrestError | Error | { message?: string } | null

interface CacheEntry {
  data: TokenPayload | null
  error: ValidationError
  expiresAt: number
}

const CACHE_TTL_MS = 60 * 1000
const NEGATIVE_CACHE_TTL_MS = 5 * 1000
const MAX_CACHE_SIZE = 500

const tokenCache = new Map<string, CacheEntry>()
const inFlightRequests = new Map<string, Promise<{ data: TokenPayload | null; error: ValidationError }>>()

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of tokenCache.entries()) {
    if (entry.expiresAt <= now) {
      tokenCache.delete(key)
    }
  }
}

export async function validateAttendanceToken(
  token: string
): Promise<{ data: TokenPayload | null; error: ValidationError }> {
  const trimmedToken = token.trim()
  if (!trimmedToken) {
    return { data: null, error: new Error('Empty token') }
  }

  const now = Date.now()
  const cached = tokenCache.get(trimmedToken)
  if (cached && cached.expiresAt > now) {
    return { data: cached.data, error: cached.error }
  }

  const existingRequest = inFlightRequests.get(trimmedToken)
  if (existingRequest) {
    return existingRequest
  }

  const requestPromise = (async () => {
    try {
      const admin = createAdminClient()
      const { data, error } = await admin.rpc('validate_attendance_token', {
        p_token: trimmedToken,
      })

      const timestamp = Date.now()
      if (tokenCache.size >= MAX_CACHE_SIZE) {
        pruneExpiredEntries(timestamp)
      }

      if (error || !data) {
        tokenCache.set(trimmedToken, {
          data: null,
          error,
          expiresAt: timestamp + NEGATIVE_CACHE_TTL_MS,
        })
        return { data: null, error }
      }

      const payload = data as TokenPayload
      tokenCache.set(trimmedToken, {
        data: payload,
        error: null,
        expiresAt: timestamp + CACHE_TTL_MS,
      })
      return { data: payload, error: null }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      }
    } finally {
      inFlightRequests.delete(trimmedToken)
    }
  })()

  inFlightRequests.set(trimmedToken, requestPromise)
  return requestPromise
}
