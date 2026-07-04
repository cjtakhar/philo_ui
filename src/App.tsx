import { useRef, useState } from 'react'
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
  kind?: string
  prompt?: string
  attempts?: number
  model_used?: string
  expected?: Record<string, unknown> | null
  report?: { passed: boolean; checks: Check[] } | null
  code?: string
  error?: string | null
}

const STATUS_ICON = { pass: '✓', fail: '✗', warn: '⚠' } as const
const POLL_MS = 2000

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [revision, setRevision] = useState('')
  const [job, setJob] = useState<Job | null>(null)
  const [busy, setBusy] = useState(false)
  const pollToken = useRef(0)

  const pollUntilDone = async (id: string) => {
    const token = ++pollToken.current
    for (;;) {
      const res = await fetch(`/api/jobs/${id}`)
      const j: Job = await res.json()
      if (token !== pollToken.current) return // superseded by a newer job
      setJob(j)
      if (j.status !== 'queued' && j.status !== 'running') {
        setBusy(false)
        return
      }
      await new Promise((r) => setTimeout(r, POLL_MS))
    }
  }

  const submit = async (url: string, body: object) => {
    setBusy(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!res.ok) {
        setJob({ id: '', status: 'failed', error: j.error })
        setBusy(false)
        return
      }
      setJob(j)
      await pollUntilDone(j.id)
    } catch (e) {
      setJob({ id: '', status: 'failed', error: String(e) })
      setBusy(false)
    }
  }

  const generate = () => {
    if (prompt.trim()) submit('/api/jobs', { prompt })
  }
  const revise = () => {
    if (revision.trim() && job?.id) {
      submit(`/api/jobs/${job.id}/revise`, { prompt: revision })
      setRevision('')
    }
  }

  const working = job?.status === 'queued' || job?.status === 'running'

  return (
    <div className="app">
      <header>
        <h1>Philo Mechanicus</h1>
        <span className="phase">Phase 1 — text → validated printable part</span>
      </header>

      <div className="prompt-bar">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a part… e.g. “M6 washer, 18mm outer diameter, 1.6mm thick”"
          rows={2}
          disabled={busy}
        />
        <button onClick={generate} disabled={busy || !prompt.trim()}>
          {busy ? 'Working…' : 'Generate'}
        </button>
      </div>

      <main>
        <section className="viewer-pane">
          {job?.status === 'validated' ? (
            <Viewer stlUrl={`/api/jobs/${job.id}/model.stl`} />
          ) : (
            <div className="placeholder">
              {working
                ? `Job ${job?.id}: ${job?.status}… (generation, sandbox, validation)`
                : job?.status === 'refused'
                  ? `Refused: ${job.error}`
                  : job?.error
                    ? `Failed: ${job.error}`
                    : 'No model yet. Describe a part above.'}
            </div>
          )}
        </section>

        <aside>
          {job?.status === 'validated' && (
            <div className="revise-bar">
              <input
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && revise()}
                placeholder="Revise… e.g. “make the bore 2mm wider”"
                disabled={busy}
              />
              <button onClick={revise} disabled={busy || !revision.trim()}>
                Revise
              </button>
            </div>
          )}

          {job?.report && (
            <div className="report">
              <h2 className={job.report.passed ? 'ok' : 'bad'}>
                Validation {job.report.passed ? 'passed' : 'FAILED'}
                {job.model_used && (
                  <span className="meta">
                    {' '}
                    · {job.model_used} · attempt {job.attempts}
                  </span>
                )}
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
