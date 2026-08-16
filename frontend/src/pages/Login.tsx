import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import AuthLayout from '../components/AuthLayout'
import { Button, Field, Input, ErrorBanner } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await login(email, password)
    setLoading(false)
    if (err) setError(err)
    else navigate('/')
  }

  return (
    <AuthLayout>
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </Field>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Register
        </Link>
      </p>
    </AuthLayout>
  )
}
