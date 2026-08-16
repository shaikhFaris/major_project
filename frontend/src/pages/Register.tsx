import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import AuthLayout from '../components/AuthLayout'
import { Button, Field, Input, ErrorBanner } from '../components/ui'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await register(email, password, name)
    setLoading(false)
    if (err) setError(err)
    else navigate('/')
  }

  return (
    <AuthLayout>
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <Input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />
        </Field>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
