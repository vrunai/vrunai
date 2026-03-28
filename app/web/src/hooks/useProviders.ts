import { useState, useCallback } from 'react'
import { loadProviders, saveProvider, deleteProvider, type SavedProvider } from '../lib/storage'

export function useProviders() {
  const [providers, setProviders] = useState<SavedProvider[]>(() => loadProviders())

  const refresh = useCallback(() => setProviders(loadProviders()), [])

  const add = useCallback((p: SavedProvider) => {
    saveProvider(p)
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteProvider(id)
    refresh()
  }, [refresh])

  const update = useCallback((p: SavedProvider) => {
    saveProvider(p)
    refresh()
  }, [refresh])

  return { providers, add, remove, update, refresh }
}
