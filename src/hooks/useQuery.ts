import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type DependencyList } from 'react'
import { getVersion, subscribe } from '@/services/mock/db'

export interface QueryState<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Minimal data-fetching hook for service calls.
 * Re-runs when `deps` change and silently refreshes whenever the mock database is mutated,
 * so screens stay in sync after create/update actions without manual cache handling.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: DependencyList = []): QueryState<T> {
  const dbVersion = useSyncExternalStore(subscribe, getVersion)
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: string | null }>({
    data: undefined,
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const depsKey = useRef<DependencyList>(deps)

  useEffect(() => {
    let cancelled = false
    const depsChanged = depsKey.current.length !== deps.length || depsKey.current.some((d, i) => d !== deps[i])
    depsKey.current = deps
    // A different record was requested: drop the previous one so detail pages never show stale data.
    if (depsChanged) setState({ data: undefined, loading: true, error: null })
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Something went wrong' }))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, dbVersion, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, refetch }
}
