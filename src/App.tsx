import { useState } from 'react'
import Viewer from './Viewer'
import './App.css'

interface Check {
  name: string
  status: 'pass' | 'fail' | 'warn'
  severity: string
  details: string
}

interface Job {
  id: string
  status: string
  report?: { passed: boolean; checks: Check[] }
  code?: string
  error?: string
}

const STATUS_ICON = { pass: '✓', fail: '✗', warn: '⚠' } as const

export default function App() {
  const [job, setJob] = useState<Job | null>(null)
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    setBusy(true)
    setJob(null)
    try {
      const res = await fetch('/api/jobs/demo-flange', { method: 'POST' })
      setJob(await res.json())
    } catch (e) {
      setJob({ id: '', status: 'failed', error: String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Philo Mechanicus</h1>
        <span className="phase">Phase 0 — hardcoded flange, full pipeline</span>
        <button onClick={generate} disabled={busy}>
          {busy ? 'Generating…' : 'Generate demo flange'}
        </button>
      </header>

      <main>
        <section className="viewer-pane">
          {job?.status === 'validated' ? (
            <Viewer stlUrl={`/api/jobs/${job.id}/model.stl`} />
          ) : (
            <div className="placeholder">
              {busy
                ? 'Running sandbox + validation…'
                : job?.error
                  ? `Failed: ${job.error}`
                  : 'No model yet. Generate one.'}
            </div>
          )}
        </section>

        <aside>
          {job?.report && (
            <div className="report">
              <h2 className={job.report.passed ? 'ok' : 'bad'}>
                Validation {job.report.passed ? 'passed' : 'FAILED'}
              </h2>
              <ul>
                {job.report.checks.map((c) => (
                  <li key={c.name} className={c.status}>
                    <span className="icon">{STATUS_ICON[c.status]}</span>
                    <span className="name">{c.name}</span>
                    <span className="details">{c.details}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {job?.code && (
            <div className="code">
              <h2>Parametric source (the blueprint)</h2>
              <pre>{job.code}</pre>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
