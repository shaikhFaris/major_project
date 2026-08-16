import { useState, useEffect } from 'react'
import { Plus, Buildings, PencilSimple, Trash, SlidersHorizontal } from '@phosphor-icons/react'
import { listBusinesses, deleteBusiness, type Business } from '../lib/api'
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Skeleton } from '../components/ui'

export default function BusinessList() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    listBusinesses().then(res => {
      if (res.success) setBusinesses(res.data)
      else setError(res.error || 'Failed to load businesses')
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this business and all its data?')) return
    const res = await deleteBusiness(id)
    if (res.success) load()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        description="Companies you model and simulate strategies for."
        actions={
          <Button href="/businesses/new">
            <Plus size={16} weight="bold" />
            New business
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {businesses.length === 0 ? (
        <EmptyState
          icon={<Buildings size={24} weight="bold" />}
          title="No businesses yet"
          description="Set up your first company to start testing pricing, marketing, and inventory strategies."
          action={
            <Button href="/businesses/new">
              <Plus size={16} weight="bold" />
              Create your first business
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map(b => (
            <Card key={b.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-100 truncate">{b.companyName}</h3>
                  <p className="text-sm text-zinc-400 truncate">{b.productName}</p>
                </div>
                <Badge tone="zinc">{b.industry}</Badge>
              </div>
              <div className="flex gap-4 text-xs text-zinc-400">
                <span>
                  <span className="text-zinc-400">Capital</span>{' '}
                  <span className="font-mono text-zinc-300">${Number(b.initialCapital).toLocaleString()}</span>
                </span>
                <span>
                  <span className="text-zinc-400">Inventory</span>{' '}
                  <span className="font-mono text-zinc-300">{b.initialInventory.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 mt-auto border-t border-zinc-800">
                <Button href={`/businesses/${b.id}/edit`} variant="secondary" size="sm">
                  <PencilSimple size={13} />
                  Edit
                </Button>
                <Button href={`/businesses/${b.id}/market-config`} variant="secondary" size="sm">
                  <SlidersHorizontal size={13} />
                  Market config
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(b.id)}>
                  <Trash size={13} />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
