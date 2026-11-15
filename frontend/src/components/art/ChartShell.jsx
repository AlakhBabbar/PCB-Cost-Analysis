// Readout line, plot area and first / last x labels shared by BarChart and AreaChart.
export default function ChartShell({ data, hover, format, height, onLeave, children }) {
  const shown = data[hover ?? data.length - 1]
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex h-5 items-baseline justify-between gap-3 text-[13px] md:text-xs">
        <span className="text-muted">{shown?.label}</span>
        <span className="font-medium tabular-nums text-ink">{shown ? format(shown.value) : ''}</span>
      </div>
      <div className="relative w-full" style={{ height }} onPointerLeave={onLeave}>{children}</div>
      <div className="flex justify-between text-[12px] md:text-[11px] text-faint">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}
