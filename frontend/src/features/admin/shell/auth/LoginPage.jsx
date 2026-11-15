import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, Input, PasswordInput, linkClass } from '../../../../components/ui'
import { useShake } from '../../../../components/motion'
import AuthLayout from './AuthLayout'

const message = (e) =>
  e.status === 401 ? 'Wrong email or password. If your request was declined, your details have been removed.'
    : e.status ? e.message : 'Could not reach the server.'

export default function LoginPage({ signIn }) {
  const navigate = useNavigate()
  const [controls, shake] = useShake()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await signIn(form.get('email'), form.get('password'))
    } catch (err) {
      if (err.code === 'pending') return navigate('/admin/pending')
      setError(message(err))
      setBusy(false)
      shake()
    }
  }

  return (
    <AuthLayout title="Sign in" description="Orders, quotes and pricing for your factory." onSubmit={submit} controls={controls}
      footer={<>No account yet? <Link to="/admin/signup" className={linkClass}>Request access</Link></>}>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password" error={error}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required aria-invalid={!!error} />
      </Field>
      <Button type="submit" size="lg" loading={busy} className="mt-1 w-full md:h-10 md:text-sm">Sign in</Button>
    </AuthLayout>
  )
}
