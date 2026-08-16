import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { ChartLineUp, ArrowRight } from '@phosphor-icons/react'
import { listSimulations, getSimulationResults, type PeriodResult, type Simulation } from '../lib/api'
import { Button, Card, EmptyState, PageHeader, Skeleton, StatCard } from '../components/ui'

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { maxTicksLimit: 12 }, grid: { display: false } },
    y: { ticks: { maxTicksLimit: 5 } },
  },
}

export default function Dashboard() {
  const [results, setResults] = useState<PeriodResult[]>([])
  const [sim, setSim] = useState<Simulation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSimulations().then(res => {
      if (res.success && res.data.length > 0) {
        const completed = res.data.filter(s => s.status === 'complete')
        if (completed.length > 0) {
          const latest = completed[0]
          setSim(latest)
          return getSimulationResults(latest.id)
        }
      }
      return null
    }).then(res => {
      if (res?.success) setResults(res.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Your business performance at a glance." />
        <EmptyState
          icon={<ChartLineUp size={24} weight="bold" />}
          title="No simulation data yet"
          description="Create a business, configure its market, and run a simulation to see results here."
          action={
            <Button href="/businesses/new">Create your first business</Button>
          }
        />
      </div>
    )
  }

  const last = results[results.length - 1]
  const totalRevenue = results.reduce((s, r) => s + r.revenue, 0)
  const totalProfit = results.reduce((s, r) => s + r.profit, 0)

  const line = (data: number[], color: string) => ({
    labels: results.map(r => `P${r.period}`),
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: color + '1a',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 4,
      borderWidth: 2,
    }],
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={sim ? `Latest run: ${sim.businessName || `Simulation #${sim.id}`}` : undefined}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} trend="up" />
        <StatCard
          label="Total Profit"
          value={`$${totalProfit.toLocaleString()}`}
          trend={totalProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard label="Latest Revenue" value={`$${Number(last.revenue).toLocaleString()}`} sub={`P${last.period}`} />
        <StatCard label="Market Share" value={`${Number(last.marketShare).toFixed(1)}%`} sub={`P${last.period}`} />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Demand" value={last.demand.toLocaleString()} sub={`P${last.period}`} />
        <StatCard label="Inventory" value={last.inventoryLevel.toLocaleString()} sub={`P${last.period}`} />
        <StatCard label="Satisfaction" value={`${Number(last.consumerSatisfaction).toFixed(1)}%`} sub={`P${last.period}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Revenue trend</h3>
          <div className="h-64">
            <Line data={line(results.map(r => r.revenue), '#34d399')} options={chartOpts} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Profit trend</h3>
          <div className="h-64">
            <Line data={line(results.map(r => r.profit), '#fbbf24')} options={chartOpts} />
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        {sim && (
          <Link
            to={`/simulations/${sim.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            View full results
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  )
}
