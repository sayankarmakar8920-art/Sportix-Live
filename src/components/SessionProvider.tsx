'use client'

import { ReactNode } from 'react'

/**
 * Minimal SessionProvider — no-op wrapper.
 * next-auth's SessionProvider was making unnecessary /api/auth/session calls
 * on every page load, causing CLIENT_FETCH_ERROR since useSession is never used.
 * This wrapper keeps the same tree structure without any network requests.
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
