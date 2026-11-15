import { CircleAlert, Download, Eye } from 'lucide-react'
import { Button, Card, KeyValue } from '../../../components/ui'
import { dateTime, fileSize } from '../../../lib/format'
import useDownload from '../files/useDownload'

const mm = (w, h) => (w && h ? `${Math.round(w * 10) / 10} x ${Math.round(h * 10) / 10} mm` : '-')
const or = (v) => (v == null || v === '' ? '-' : String(v))

function Compare({ file, specs }) {
  const rows = [
    ['Board size', mm(file.widthMm, file.heightMm), mm(specs.boardW, specs.boardL)],
    ['Copper layers', or(file.copperLayers), or(specs.layers)],
    ['Smallest hole', file.minDrillMm ? `${file.minDrillMm} mm` : '-', specs.minHole ? `${specs.minHole} mm` : '-'],
  ]
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-line text-[14px] md:text-[13px]">
      <div className="grid grid-cols-3 gap-2 bg-[#fafaf9] px-3 py-2 text-muted">
        <span />
        <span className="font-medium">The file says</span>
        <span className="font-medium">Buyer typed</span>
      </div>
      {rows.map(([label, a, b]) => (
        <div key={label} className={`grid grid-cols-3 gap-2 border-t border-line px-3 py-2 ${a !== b ? 'font-medium text-ink' : 'text-muted'}`}>
          <span className="text-muted font-normal">{label}</span>
          <span className="tabular-nums">{a}</span>
          <span className="tabular-nums">{b}</span>
        </div>
      ))}
    </div>
  )
}

export default function FileCard({ file, specs, needsReview, reasons, onPreview, previewing }) {
  const { download, busy } = useDownload()
  if (!file) {
    return <Card title="File"><p className="text-[15px] md:text-sm text-muted">No Gerber file is linked to this order.</p></Card>
  }
  return (
    <Card
      title="File"
      actions={<Button variant="secondary" size="sm" icon={Download} loading={busy === file.id} onClick={() => download(file.id)}>Download</Button>}
    >
      {needsReview && reasons?.length > 0 && (
        <div role="alert" className="mb-4 flex gap-2.5 rounded-lg border border-[#f0d9a8] bg-[#fbefd6] px-3.5 py-3 text-[#7a4e00]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-[15px] md:text-sm font-medium">Check the file before you make this board</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[14px] md:text-[13px]">
              {reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
      <KeyValue items={[
        { label: 'File name', value: <span className="break-all">{file.filename}</span> },
        { label: 'Size', value: fileSize(file.sizeBytes) },
        { label: 'Uploaded', value: dateTime(file.createdAt) },
        !file.parseOk && { label: 'Readable', value: 'No, the file could not be read' },
      ]} />
      {needsReview && <Compare file={file} specs={specs ?? {}} />}
      {file.warnings?.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] md:text-xs font-medium text-muted">Notes from reading the file</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[14px] md:text-[13px] text-muted">
            {file.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}
      {!previewing && file.parseOk && (
        <Button variant="ghost" size="sm" icon={Eye} onClick={onPreview} className="-ml-2 mt-3">Show board preview</Button>
      )}
    </Card>
  )
}
