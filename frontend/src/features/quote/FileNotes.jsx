import { Badge } from '../../components/ui'

const NOISE = ['Standard layer detection failed', 'Unrecognised layer skipped']

// What the parser found, why a file cannot be ordered, and its softer notes.
export default function FileNotes({ parsed }) {
  const warnings = (parsed.warnings ?? []).filter((w) => !NOISE.some((n) => w.startsWith(n)))
  const errors = parsed.errors?.length ? parsed.errors : ['We could not find the board size in this file.']
  const { width_mm: w, height_mm: h } = parsed.dimensions ?? {}
  return (
    <div className="mt-3 flex flex-col gap-3 text-[13px] md:text-xs text-muted">
      {parsed.ok ? (
        <p>{parsed.layer_count} files read, {parsed.copper_layer_count} copper layers, {w?.toFixed(1)} x {h?.toFixed(1)} mm</p>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg bg-canvas p-3">
          <Badge tone="alert" className="self-start">This file cannot be ordered</Badge>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-ink">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          <p>Fix the file and upload it again. You can still get a price by typing the board details.</p>
        </div>
      )}
      {warnings.length > 0 && (
        <details>
          <summary className="cursor-pointer select-none">{warnings.length} note{warnings.length > 1 ? 's' : ''} about this file</summary>
          <ul className="mt-2 flex flex-col gap-1 list-disc pl-4">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </details>
      )}
    </div>
  )
}
