import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, PlayCircle, Play, CaretRight } from '@phosphor-icons/react'
import { listSimulations, listBusinesses, getMarketConfig, createSimulation, runSimulation, type Simulation } from '../lib/api'
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, PageHeader, Select, Skeleton } from '../components/ui'

const statusTone: Record<string, 'zinc' | 'emerald' | 'red' | 'sky'> = {
  pending: 'zinc',
  running: 'sky',
  complete: 'emerald',
  failed: 'red',
}

export default function Simulations() {
  const navigate = useNavigate()
  const [sims, setSims] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [businesses, setBusinesses] = useState<{ id: number; name: string }[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    listSimulations().then(res => {
      if (res.success) setSims(res.data)
      else setError(res.error || 'Failed to load simulations')
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function openCreate() {
    setCreateError(null)
    const res = await listBusinesses()
    if (res.success && res.data.length > 0) {
      setBusinesses(res.data.map(b => ({ id: b.id, name: b.companyName })))
      setShowCreate(true)
    } else if (res.success) {
      setCreateError('Create a business and its market config first.')
      setShowCreate(true)
    } else {
      setCreateError(res.error || 'Failed to load businesses')
      setShowCreate(true)
    }
  }

  async function handleCreate() {
    if (!selectedBiz) return
    setCreating(true)
    setCreateError(null)
    const bizId = Number(selectedBiz)
    const mktRes = await getMarketConfig(bizId)
    if (!mktRes.success || !mktRes.data) {
      setCreateError('This business has no market config. Create one from the business card first.')
      setCreating(false)
      return
    }
    const simRes = await createSimulation(bizId, mktRes.data.id)
    if (simRes.success) {
      await runSimulation(simRes.data.id)
      setShowCreate(false)
      setSelectedBiz('')
      load()
    } else {
      setCreateError(simRes.error || 'Failed to create simulation')
    }
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulations"
        description="Each run replays 12 periods against your business and market configuration."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} weight="bold" />
            New simulation
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {showCreate && (
        <Card className="p-5 space-y-4">
          <h3 className="font-medium text-zinc-100">Create and run simulation</h3>
          {createError && <ErrorBanner message={createError} />}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <Field label="Select business">
                <Select
                  value={selectedBiz}
                  onChange={e => setSelectedBiz(e.target.value)}
                  disabled={businesses.length === 0}
                >
                  <option value="">Choose...</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button onClick={handleCreate} disabled={creating || !selectedBiz}>
              <Play size={15} weight="fill" />
              {creating ? 'Running...' : 'Create and run'}
            </Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {sims.length === 0 ? (
        <EmptyState
          icon={<PlayCircle size={24} weight="bold" />}
          title="No simulations yet"
          description="Pick a business, run a 12-period simulation, and see how your strategy plays out."
          action={
            <Button onClick={openCreate}>
              <Play size={15} weight="fill" />
              Run your first simulation
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-zinc-800 overflow-hidden">
          {sims.map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/simulations/${s.id}`)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors duration-150 group"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-100 truncate">
                  {s.businessName || `Simulation #${s.id}`}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {s.strategyLabel || 'Baseline'}
                  <span className="mx-2 text-zinc-700">·</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge tone={statusTone[s.status] || 'zinc'}>{s.status}</Badge>
                <CaretRight size={15} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  )
}
