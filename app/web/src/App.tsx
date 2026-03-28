import { useTheme } from './hooks/useTheme'
import { useAppState } from './hooks/useAppState'
import { useProviders } from './hooks/useProviders'
import { useHistory } from './hooks/useHistory'
import { useEvalRunner } from './hooks/useEvalRunner'
import { Sidebar } from './components/layout/Sidebar'
import { EvaluateScreen } from './screens/EvaluateScreen'
import { RunningScreen } from './screens/RunningScreen'
import { RunningOverviewScreen } from './screens/RunningOverviewScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { ProvidersScreen } from './screens/ProvidersScreen'
import { ModelsScreen } from './screens/ModelsScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { AboutScreen } from './screens/AboutScreen'
import { makeProvider, uid } from '@vrunai/core'
import type { AgentSpec } from '@vrunai/types'
import type { ProviderSelection } from './screens/EvaluateScreen'
import { DEMO_RESULTS } from './demo/results'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { view, setView, nav, navToRun, navToOverview, loadSpec, startRun, updateProgress, setRunError, showResults, showDemoResults, cancelRun, activeScreen, totalRunningCount, backgroundRuns } = useAppState()
  const { providers, add: addProvider, update: updateProvider, remove: removeProvider } = useProviders()
  const { history, add: addHistory, remove: removeHistory, clear: clearHistory } = useHistory()
  const { run } = useEvalRunner()

  function handleRun(spec: AgentSpec, selections: ProviderSelection[], runsPerScenario: number, maxTurns?: number) {
    if (!selections.length) return

    const runId = uid()
    const providerInstances = selections.map(({ provider, model }) =>
      makeProvider(provider.kind, { model, apiKey: provider.apiKey, baseUrl: provider.baseUrl })
    )

    run(spec, providerInstances, {
      runsPerScenario,
      maxTurns,
      onStart: (cancel) => {
        // cancel is delivered synchronously before any await — wire it up immediately
        startRun(runId, spec, cancel)
        // Pre-populate queued state for ALL models now that view is 'running'.
        // Must happen after startRun so the functional setView updaters chain correctly.
        for (const { model } of selections) {
          for (const s of spec.scenarios) {
            updateProgress(runId, model, s.name, 'queued')
          }
        }
      },
      onProgress: (model, scenarioName, runIndex, _total) => {
        const status = runIndex === 0 ? 'queued' : runIndex < _total ? 'running' : 'done'
        updateProgress(runId, model, scenarioName, status)
      },
      onComplete: (results) => {
        const savedAt = new Date().toISOString()
        addHistory({
          id: uid(),
          agentName: spec.agent.name,
          savedAt,
          results,
        })
        showResults(runId, spec, results, savedAt)
      },
      onCancel: () => {
        setView(prev => {
          if (prev.screen === 'running' && prev.id === runId) {
            return { screen: 'evaluate', spec }
          }
          return prev
        })
      },
      onError: (err) => {
        setRunError(runId, err.message)
      },
    })
  }

  function handleDemoRun(spec: AgentSpec, demoLabel: string) {
    const results = DEMO_RESULTS[demoLabel]
    if (!results) return
    showDemoResults(spec, results)
  }

  function handleHistoryOpen(entry: { results: typeof history[0]['results']; id: string; agentName: string; savedAt: string }) {
    // We need a spec to reopen results — but history only stores results, not the spec
    // Show a simplified results view using a minimal spec derived from metric data
    const firstResult = entry.results[0]
    if (!firstResult) return

    // Build a minimal stub spec from the stored metrics
    const scenarioNames = firstResult.metrics.map(m => m.scenarioName)
    const stubSpec: AgentSpec = {
      agent: { name: entry.agentName, description: '', instruction: '' },
      tools: [],
      flow: [],
      scenarios: scenarioNames.map(name => ({
        name,
        input: '',
        context: {},
        expectedPath: [],
        expectedTools: [],
        expectedOutcome: {},
        mockOverride: undefined,
      })),
    }
    // History entries have no runId — navigate directly without going through showResults logic
    setView({ screen: 'results', spec: stubSpec, results: entry.results, savedAt: entry.savedAt })
  }

  function handleNavToRuns() {
    if (totalRunningCount > 1) navToOverview()
    else navToRun()
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        active={activeScreen()}
        onNav={nav}
        providerCount={providers.length}
        historyCount={history.length}
        totalRunningCount={totalRunningCount}
        onNavToRuns={handleNavToRuns}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 overflow-hidden flex flex-col" style={{ minWidth: 0 }}>
        {view.screen === 'evaluate' && (
          <EvaluateScreen
            spec={view.spec}
            providers={providers}
            onLoad={loadSpec}
            onRun={(selections, runsPerScenario, maxTurns) => {
              if (view.spec) handleRun(view.spec, selections, runsPerScenario, maxTurns)
            }}
            onDemoRun={(spec, demoLabel) => handleDemoRun(spec, demoLabel)}
            onGoToProviders={() => nav('providers')}
            theme={theme}
          />
        )}

        {view.screen === 'running' && (
          <RunningScreen
            spec={view.spec}
            progress={view.progress}
            cancelFn={view.cancelFn}
            error={view.error}
            onGoBack={() => loadSpec(view.spec)}
          />
        )}

        {view.screen === 'running-overview' && (
          <RunningOverviewScreen
            runs={backgroundRuns}
            onSelect={navToRun}
            onCancel={cancelRun}
          />
        )}

        {view.screen === 'results' && (
          <ResultsScreen
            spec={view.spec}
            results={view.results}
            savedAt={view.savedAt}
            isDemoMode={view.isDemoMode}
            onNewRun={() => loadSpec(view.spec)}
          />
        )}

        {view.screen === 'providers' && (
          <ProvidersScreen
            providers={providers}
            onAdd={addProvider}
            onUpdate={updateProvider}
            onDelete={removeProvider}
          />
        )}

        {view.screen === 'models' && <ModelsScreen />}

        {view.screen === 'history' && (
          <HistoryScreen
            history={history}
            onOpen={handleHistoryOpen}
            onDelete={removeHistory}
            onClear={clearHistory}
          />
        )}

        {view.screen === 'about' && <AboutScreen theme={theme} />}
      </main>
    </div>
  )
}
