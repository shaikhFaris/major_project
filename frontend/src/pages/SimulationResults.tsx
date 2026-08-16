import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { ArrowLeft } from '@phosphor-icons/react'
import { getSimulationResults, type PeriodResult } from '../lib/api'
import { Card, EmptyState, PageHeader, Skeleton, StatCard } from '../components/ui'

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { maxTicksLimit: 12 }, grid: { display: false } },
    y: { ticks: { maxTicksLimit: 5 } },
  },
}

export default function SimulationResults() {
  const { id } = useParams()
  const [results, setResults] = useState<PeriodResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getSimulationResults(Number(id)).then(res => {
      if (res.success) setResults(res.data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Simulation #${id}`} />
        <EmptyState
          icon={<ArrowLeft size={24} weight="bold" />}
          title="No results yet"
          description="This simulation has not produced any periods yet."
          action={
            <Link to="/simulations" className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              <ArrowLeft size={15} />
              Back to simulations
            </Link>
          }
        />
      </div>
    )
  }

  const last = results[results.length - 1]
  const totalRevenue = results.reduce((s, r) => s + Number(r.revenue), 0)
  const totalProfit = results.reduce((s, r) => s + Number(r.profit), 0)

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
        title={`Simulation #${id}`}
        description={`${results.length} periods · completed`}
        actions={
          <Link
            to="/simulations"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </Link>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Periods" value={String(results.length)} />
        <StatCard label="Total revenue" value={`$${totalRevenue.toLocaleString()}`} trend="up" />
        <StatCard label="Total profit" value={`$${totalProfit.toLocaleString()}`} trend={totalProfit >= 0 ? 'up' : 'down'} />
        <StatCard label="Final market share" value={`${Number(last.marketShare).toFixed(1)}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Revenue</h3>
          <div className="h-64"><Line data={line(results.map(r => Number(r.revenue)), '#34d399')} options={chartOpts} /></div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Profit</h3>
          <div className="h-64"><Line data={line(results.map(r => Number(r.profit)), '#fbbf24')} options={chartOpts} /></div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">Demand</h3>
          <div className="h-64"><Line data={line(results.map(r => r.demand), '#38bdf8')} options={chartOpts} /></div>
        </Card>
      </div>

      {/* Data table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-800/50 text-zinc-400 text-[11px] uppercase tracking-[0.12em]">
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-right px-4 py-3 font-medium">Demand</th>
                <th className="text-right px-4 py-3 font-medium">Sold</th>
                <th className="text-right px-4 py-3 font-medium">Revenue</th>
                <th className="text-right px-4 py-3 font-medium">Cost</th>
                <th className="text-right px-4 py-3 font-medium">Profit</th>
                <th className="text-right px-4 py-3 font-medium">Market share</th>
                <th className="text-right px-4 py-3 font-medium">Inventory</th>
                <th className="text-right px-4 py-3 font-medium">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {results.map(r => (
                <tr key={r.period} className="hover:bg-zinc-800/30 transition-colors duration-100 font-mono">
                  <td className="px-4 py-3 text-zinc-300 font-sans font-medium">{r.period}</td>
                  <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{r.demand.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{r.unitsSold?.toLocaleString() ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 tabular-nums">${Number(r.revenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">${Number(r.cost).toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(r.profit) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${Number(r.profit).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sky-400 tabular-nums">{Number(r.marketShare).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{r.inventoryLevel.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{Number(r.consumerSatisfaction).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
