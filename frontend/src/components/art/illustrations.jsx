import Frame, { Accent, Pad } from './Frame'

export function EmptyOrders(props) {
  return (
    <Frame label="Empty box" {...props}>
      <path d="M38 66h84v38H38z" />
      <path d="M38 66l14-12h56l14 12" />
      <path d="M38 66l-10-10 14-12 10 10M122 66l10-10-14-12-10 10" />
      <path d="M70 80h20" />
      <Accent d="M58 20h44v30H58z" />
      <path d="M66 30h10l6 6h12M66 42h8" />
      <Pad x={95} y={42} r={2} accent />
      <path d="M80 56v4M74 57l-1 3M86 57l1 3" strokeDasharray="1 3" />
    </Frame>
  )
}

export function EmptyAbandoned(props) {
  return (
    <Frame label="Empty cart" {...props}>
      <path d="M22 30h12l11 46h58l9-32H40" />
      <path d="M48 62h58" />
      <circle cx="54" cy="90" r="5" />
      <circle cx="98" cy="90" r="5" />
      <Accent d="M58 36h36v14H58z" />
      <Pad x={66} y={43} r={1.8} accent />
      <Pad x={86} y={43} r={1.8} accent />
      <path d="M116 90c8 0 12-8 20-8s10 4 14 4" strokeDasharray="3 4" />
    </Frame>
  )
}

export function EmptyRequests(props) {
  return (
    <Frame label="Empty clipboard" {...props}>
      <path d="M46 18h68v88H46z" />
      <path d="M66 12h28v12H66z" />
      <path d="M56 40h48M56 52h48M56 64h30" />
      <path d="M56 76l4 4 8-8" />
      <Accent d="M92 76h16l8 9-8 9H92z" />
      <Pad x={98} y={85} r={2} accent />
    </Frame>
  )
}

export function EmptyCustomers(props) {
  return (
    <Frame label="Empty contact cards" {...props}>
      <path d="M54 20h78v50H54z" />
      <path d="M118 30h4M64 30h30" />
      <path d="M30 44h78v52H30z" fill="white" />
      <circle cx="50" cy="66" r="9" />
      <path d="M45 80c2-4 8-4 10 0" />
      <path d="M68 60h28M68 70h18" />
      <Accent d="M42 88h54" />
    </Frame>
  )
}

export function EmptyFiles(props) {
  return (
    <Frame label="Gerber layers" {...props}>
      <path d="M80 70l44 15-44 15-44-15z" />
      <path d="M80 54l44 15-44 15-44-15z" fill="white" />
      <Accent d="M80 36l44 15-44 15-44-15z" />
      <path d="M62 51l12 4h14l10-4" />
      <Pad x={70} y={47} r={1.8} />
      <Pad x={92} y={47} r={1.8} />
      <Pad x={80} y={58} r={1.8} />
    </Frame>
  )
}

export function EmptyActivity(props) {
  return (
    <Frame label="Empty timeline" {...props}>
      <path d="M48 24v76" strokeDasharray="2 4" />
      <circle cx="48" cy="28" r="5" fill="white" stroke="var(--color-accent)" />
      <circle cx="48" cy="60" r="5" fill="white" />
      <circle cx="48" cy="92" r="5" fill="white" />
      <Accent d="M62 26h52M62 34h30" />
      <path d="M62 58h44M62 66h26M62 90h50M62 98h22" />
    </Frame>
  )
}

export function SetupNeeded(props) {
  return (
    <Frame label="Unplugged board" {...props}>
      <path d="M22 32h80v58H22z" />
      <path d="M34 44h20l8 8h16M34 78h14l6-6h22" />
      <Pad x={82} y={52} r={2.5} />
      <Pad x={80} y={72} r={2.5} />
      <path d="M58 58h12v12H58z" />
      <path d="M102 61h10" />
      <Accent d="M112 61c10 0 8-18 20-18" />
      <path d="M132 37h10v12h-10zM142 40h6M142 46h6" stroke="var(--color-accent)" />
    </Frame>
  )
}

export function BoardStack(props) {
  return (
    <Frame label="Circuit board" {...props}>
      <path d="M28 52v8l52 18 52-18v-8M80 70v8" />
      <path d="M80 34l52 18-52 18-52-18z" fill="white" />
      <Accent d="M80 44l14 5-14 5-14-5z" />
      <path d="M94 49l14 5M66 49l-14 5M80 54v8M80 44v-5" />
      <Pad x={110} y={55} r={2} />
      <Pad x={50} y={55} r={2} />
      <Pad x={80} y={64} r={2} />
      <Pad x={80} y={37} r={2} />
    </Frame>
  )
}
