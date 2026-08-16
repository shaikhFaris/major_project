import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createMarketConfig, getMarketConfig, getBusiness, updateMarketConfig, type MarketConfig } from '../lib/api'
import { Button, ErrorBanner, Field, Input, PageHeader, SectionCard, Select, Skeleton } from '../components/ui'

const demandLevels = ['low', 'medium', 'high']
const economies = ['recession', 'stable', 'growing', 'booming']
const seasons = ['normal', 'holiday', 'summer', 'winter']
const incomes = ['low', 'medium', 'high']
const supplies = ['limited', 'moderate', 'sufficient', 'abundant']

const emptyForm = {
  marketSize: '10000', population: '50000', numCompetitors: '3',
  demandLevel: 'medium', economicCondition: 'stable', inflation: '2',
  season: 'normal', customerIncome: 'medium', taxRate: '10',
  supplyAvailability: 'sufficient', governmentPolicies: '',
}

export default function MarketConfigForm() {
  const { id: businessId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<number | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!businessId) {
      setFetching(false)
      return
    }
    Promise.all([
      getBusiness(Number(businessId)),
      getMarketConfig(Number(businessId)),
    ]).then(([bizRes, mktRes]) => {
      if (bizRes.success) setBusinessName(bizRes.data.companyName)
      if (mktRes.success && mktRes.data) {
        const m = mktRes.data
        setExistingId(m.id)
        setForm({
          marketSize: String(m.marketSize), population: String(m.population),
          numCompetitors: String(m.numCompetitors), demandLevel: m.demandLevel,
          economicCondition: m.economicCondition, inflation: String(m.inflation),
          season: m.season, customerIncome: m.customerIncome,
          taxRate: String(m.taxRate), supplyAvailability: m.supplyAvailability,
          governmentPolicies: m.governmentPolicies || '',
        })
      }
    }).catch(() => setError('Failed to load market data'))
      .finally(() => setFetching(false))
  }, [businessId])

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setError(null)
    setLoading(true)
    const payload = {
      businessId: Number(businessId),
      marketSize: Number(form.marketSize),
      population: Number(form.population),
      numCompetitors: Number(form.numCompetitors),
      demandLevel: form.demandLevel,
      economicCondition: form.economicCondition,
      inflation: Number(form.inflation),
      season: form.season,
      customerIncome: form.customerIncome,
      taxRate: Number(form.taxRate),
      supplyAvailability: form.supplyAvailability,
      governmentPolicies: form.governmentPolicies || null,
    }

    const res = existingId
      ? await updateMarketConfig(existingId, payload)
      : await createMarketConfig(payload)

    setLoading(false)
    if (res.success) navigate('/businesses')
    else setError(res.error || 'Failed to save market config')
  }

  if (fetching) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Market configuration"
        description={businessName ? `For ${businessName}` : undefined}
      />

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Market size and competition">
          <Field label="Market size" hint="Total addressable market">
            <Input type="number" min={0} value={form.marketSize} onChange={e => set('marketSize', e.target.value)} required />
          </Field>
          <Field label="Population" hint="Total population in the market">
            <Input type="number" min={0} value={form.population} onChange={e => set('population', e.target.value)} required />
          </Field>
          <Field label="Number of competitors">
            <Input type="number" min={0} value={form.numCompetitors} onChange={e => set('numCompetitors', e.target.value)} required />
          </Field>
        </SectionCard>

        <SectionCard title="Economic conditions">
          <Field label="Demand level">
            <Select value={form.demandLevel} onChange={e => set('demandLevel', e.target.value)}>
              {demandLevels.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Economic condition">
            <Select value={form.economicCondition} onChange={e => set('economicCondition', e.target.value)}>
              {economies.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Inflation rate" hint="Percent per period">
            <Input type="number" min={0} value={form.inflation} onChange={e => set('inflation', e.target.value)} required />
          </Field>
          <Field label="Season">
            <Select value={form.season} onChange={e => set('season', e.target.value)}>
              {seasons.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </SectionCard>

        <SectionCard title="Customer and regulatory">
          <Field label="Customer income level">
            <Select value={form.customerIncome} onChange={e => set('customerIncome', e.target.value)}>
              {incomes.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Tax rate" hint="Percent applied to revenue">
            <Input type="number" min={0} value={form.taxRate} onChange={e => set('taxRate', e.target.value)} required />
          </Field>
          <Field label="Supply availability">
            <Select value={form.supplyAvailability} onChange={e => set('supplyAvailability', e.target.value)}>
              {supplies.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Government policies" hint="Optional free text">
            <Input value={form.governmentPolicies} onChange={e => set('governmentPolicies', e.target.value)} />
          </Field>
        </SectionCard>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : existingId ? 'Update market config' : 'Save market config'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/businesses')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
