import { useState, useEffect } from 'react'
import type { AgentSpec, ComparisonResult } from '@vrunai/types'

export type Screen = 'evaluate' | 'providers' | 'models' | 'history' | 'about' | 'running-overview'

export type RunProgress = {
  [model: string]: {
    [scenarioName: string]: 'queued' | 'running' | 'done' | 'error'
  }
}

export type RunningSnapshot = {
  id: string
  spec: AgentSpec
  progress: RunProgress
  cancelFn: (() => void) | null
}

export type AppView =
  | { screen: 'evaluate'; spec: AgentSpec | null }
  | { screen: 'running'; id: string; spec: AgentSpec; progress: RunProgress; cancelFn: (() => void) | null; error?: string }
  | { screen: 'results'; spec: AgentSpec; results: ComparisonResult[]; savedAt?: string; isDemoMode?: boolean }
  | { screen: 'running-overview' }
  | { screen: 'providers' }
  | { screen: 'models' }
  | { screen: 'history' }
  | { screen: 'about' }

export function useAppState() {
  const [view, setView] = useState<AppView>({ screen: 'evaluate', spec: null })
  const [backgroundRuns, setBackgroundRuns] = useState<RunningSnapshot[]>([])

  // Push the currently-viewed running screen to background (no-op if not running)
  function pushCurrentToBackground() {
    if (view.screen !== 'running') return
    const snap: RunningSnapshot = { id: view.id, spec: view.spec, progress: view.progress, cancelFn: view.cancelFn }
    setBackgroundRuns(brs => {
      const idx = brs.findIndex(r => r.id === snap.id)
      if (idx >= 0) { const next = [...brs]; next[idx] = snap; return next }
      return [...brs, snap]
    })
  }

  function nav(screen: Screen) {
    // Read view from closure — never call setBackgroundRuns inside a setView updater
    pushCurrentToBackground()
    if (screen === 'evaluate') {
      setView({ screen: 'evaluate', spec: null })
    } else {
      setView({ screen })
    }
  }

  function navToRun(id?: string) {
    const target = id
      ? backgroundRuns.find(r => r.id === id)
      : backgroundRuns[backgroundRuns.length - 1]
    if (!target) return

    // Swap: push currently-viewed run (if any) to background, restore target
    let newBrs = backgroundRuns.filter(r => r.id !== target.id)
    if (view.screen === 'running') {
      newBrs = [...newBrs, { id: view.id, spec: view.spec, progress: view.progress, cancelFn: view.cancelFn }]
    }

    setBackgroundRuns(newBrs)
    setView({ screen: 'running', id: target.id, spec: target.spec, progress: target.progress, cancelFn: target.cancelFn })
  }

  function navToOverview() {
    pushCurrentToBackground()
    setView({ screen: 'running-overview' })
  }

  function loadSpec(spec: AgentSpec) {
    setView({ screen: 'evaluate', spec })
  }

  function startRun(id: string, spec: AgentSpec, cancelFn: (() => void) | null) {
    // Read view from closure — never call setBackgroundRuns inside a setView updater
    pushCurrentToBackground()
    setView({ screen: 'running', id, spec, progress: {}, cancelFn })
  }

  function updateProgress(runId: string, model: string, scenarioName: string, status: 'queued' | 'running' | 'done' | 'error') {
    const applyUpdate = (progress: RunProgress): RunProgress => ({
      ...progress,
      [model]: { ...progress[model], [scenarioName]: status },
    })

    setView(prev => {
      if (prev.screen === 'running' && prev.id === runId) {
        return { ...prev, progress: applyUpdate(prev.progress) }
      }
      return prev
    })

    setBackgroundRuns(brs => {
      const idx = brs.findIndex(r => r.id === runId)
      if (idx < 0) return brs
      const next = [...brs]
      next[idx] = { ...next[idx], progress: applyUpdate(next[idx].progress) }
      return next
    })
  }

  function cancelRun(runId: string) {
    // Cancel a background run and remove it from the list
    const bg = backgroundRuns.find(r => r.id === runId)
    if (bg) {
      bg.cancelFn?.()
      setBackgroundRuns(brs => brs.filter(r => r.id !== runId))
    }
    // Cancel and navigate away if it's the currently-viewed run
    // Read view from closure — no side effects inside setView updater
    if (view.screen === 'running' && view.id === runId) {
      view.cancelFn?.()
      setView({ screen: 'evaluate', spec: view.spec })
    }
  }

  function setRunError(runId: string, error: string) {
    setView(prev => {
      if (prev.screen === 'running' && prev.id === runId) {
        return { ...prev, error }
      }
      return prev
    })
  }

  function showResults(runId: string, spec: AgentSpec, results: ComparisonResult[], savedAt?: string, isDemoMode?: boolean) {
    setBackgroundRuns(brs => brs.filter(r => r.id !== runId))
    setView(prev => {
      if (prev.screen === 'running' && prev.id === runId) {
        return { screen: 'results', spec, results, savedAt, isDemoMode }
      }
      return prev
    })
  }

  function showDemoResults(spec: AgentSpec, results: ComparisonResult[]) {
    setView({ screen: 'results', spec, results, isDemoMode: true })
  }

  function activeScreen(): Screen {
    const s = view.screen
    if (s === 'running' || s === 'results') return 'evaluate'
    return s as Screen
  }

  const totalRunningCount = backgroundRuns.length + (view.screen === 'running' ? 1 : 0)

  useEffect(() => {
    if (totalRunningCount === 0) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [totalRunningCount])

  return {
    view, setView,
    backgroundRuns,
    nav, navToRun, navToOverview,
    loadSpec,
    startRun, updateProgress, setRunError, showResults, showDemoResults, cancelRun,
    activeScreen,
    totalRunningCount,
  }
}
