import { useState, useCallback } from 'react'
import { loadHistory, appendHistory, deleteHistoryEntry, clearHistory, type HistoryEntry } from '../lib/storage'

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  const refresh = useCallback(() => setHistory(loadHistory()), [])

  const add = useCallback((entry: HistoryEntry) => {
    appendHistory(entry)
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteHistoryEntry(id)
    refresh()
  }, [refresh])

  const clear = useCallback(() => {
    clearHistory()
    refresh()
  }, [refresh])

  return { history, add, remove, clear, refresh }
}
