import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, Input, Textarea, linkClass } from '../../../../components/ui'
import { useShake } from '../../../../components/motion'
import { signup } from '../../../../api/auth'
import AuthLayout from './AuthLayout'

const FIELDS = [
  ['name', 'Name', { autoComplete: 'name', autoFocus: true }],
  ['phone', 'Phone', { type: 'tel', autoComplete: 'tel', minLength: 5 }],
  ['email', 'Email', { type: 'email', autoComplete: 'email' }],
  ['password', 'Password', { type: 'password', autoComplete: 'new-password', minLength: 8 }, 'At least 8 characters'],
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [controls, shake] = useShake()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const { name, phone, email, password, note } = Object.fromEntries(new FormData(form))
    form.password.value = ''
    setBusy(true)
    setError(null)
    try {
      await signup({ name: name.trim(), phone: phone.trim(), email: email.trim(), password, note: note.trim() || undefined })
      navigate('/admin/pending')
    } catch (err) {
      setError(err.status ? err.message : 'Could not reach the server.')
      setBusy(false)
      shake()
    }
  }

  return (
    <AuthLayout title="Request access" description="The owner reviews every request before you can sign in." onSubmit={submit} controls={controls}
      footer={<>Already approved? <Link to="/admin/login" className={linkClass}>Sign in</Link></>}>
      {FIELDS.map(([id, label, props, help]) => (
        <Field key={id} label={label} htmlFor={id} help={help}>
          <Input id={id} name={id} required pattern={id === 'password' ? undefined : '.*\\S.*'} {...props} />
        </Field>
      ))}
      <Field label="Note (optional)" htmlFor="note" help="Who you are and why you need access">
        <Textarea id="note" name="note" maxLength={500} />
      </Field>
      {error && <p role="alert" className="text-[13px] text-[#b42318]">{error}</p>}
      <Button type="submit" size="lg" loading={busy} className="mt-1 w-full md:h-10 md:text-sm">Request access</Button>
    </AuthLayout>
  )
}
