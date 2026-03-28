import { useCallback } from 'react'
import type { AgentSpec, ComparisonResult } from '@vrunai/types'
import type { Provider } from '@vrunai/core'
import { ScenarioRunner } from '@vrunai/core'

interface RunOptions {
  runsPerScenario?: number
  maxTurns?: number
  onStart?: (cancel: () => void) => void
  onProgress?: (model: string, scenarioName: string, runIndex: number, total: number) => void
  onComplete?: (results: ComparisonResult[]) => void
  onCancel?: () => void
  onError?: (err: Error) => void
}

export function useEvalRunner() {
  const run = useCallback(async (
    spec: AgentSpec,
    providers: Provider[],
    opts: RunOptions = {}
  ): Promise<() => void> => {
    const cancelSignal = { cancelled: false }
    const cancel = () => { cancelSignal.cancelled = true }
    opts.onStart?.(cancel)   // deliver cancel fn synchronously before any await

    const results: ComparisonResult[] = []
    let hadError = false

    for (const provider of providers) {
      if (cancelSignal.cancelled) break

      const model = provider.getConfig().model

      // Mark all scenarios as queued initially
      for (const scenario of spec.scenarios) {
        opts.onProgress?.(model, scenario.name, 0, opts.runsPerScenario ?? spec.scoring?.runs_per_scenario ?? 1)
      }

      const runner = new ScenarioRunner(spec, provider, {
        maxTurns:    opts.maxTurns,
        concurrency: 1,
        cancelSignal,
        onProgress: ({ scenarioName, runIndex, total }) => {
          if (!cancelSignal.cancelled) {
            opts.onProgress?.(model, scenarioName, runIndex + 1, total)
          }
        },
      })

      try {
        const metrics = await runner.runAllScenarios(opts.runsPerScenario)
        results.push({ model, metrics })
      } catch (err) {
        if (!cancelSignal.cancelled) {
          hadError = true
          opts.onError?.(err instanceof Error ? err : new Error(String(err)))
        }
        break
      }
    }

    if (cancelSignal.cancelled) {
      opts.onCancel?.()
    } else if (!hadError) {
      opts.onComplete?.(results)
    }

    return cancel
  }, [])

  return { run }
}
