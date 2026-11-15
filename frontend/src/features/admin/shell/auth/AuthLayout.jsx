import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { Cpu } from 'lucide-react'
import { FadeIn } from '../../../../components/motion'

export default function AuthLayout({ art, title, description, onSubmit, footer, controls, children }) {
  const Tag = onSubmit ? m.form : m.div
  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 md:grid md:place-items-center">
      <div className="mx-auto w-full max-w-[400px]">
        <Link to="/admin/login" className="mb-6 flex items-center justify-center gap-2 text-[15px] font-semibold text-ink">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white"><Cpu className="h-4 w-4" /></span>
          PCB Admin
        </Link>
        <FadeIn y={12}>
          <Tag
            onSubmit={onSubmit}
            animate={controls}
            className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-hair md:p-7"
          >
            {art && <div className="flex justify-center">{art}</div>}
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight text-ink">{title}</h1>
              {description && <p className="mt-1 text-[15px] md:text-sm leading-relaxed text-muted">{description}</p>}
            </div>
            {children}
          </Tag>
        </FadeIn>
        {footer && <p className="mt-5 text-center text-[15px] md:text-sm text-muted">{footer}</p>}
      </div>
    </main>
  )
}
