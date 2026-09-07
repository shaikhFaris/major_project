import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBusiness, getBusiness, updateBusiness, type Business } from '../lib/api'
import { Button, ErrorBanner, Field, Input, PageHeader, SectionCard, Select, Skeleton } from '../components/ui'
import { useActiveBusiness } from '../lib/businessContext'

const industries = ['Technology', 'Retail', 'Manufacturing', 'Healthcare', 'Finance', 'Education', 'Food & Beverage', 'Other']
const businessTypes = ['B2B', 'B2C', 'D2C', 'Wholesale', 'Service']
const adChannels = ['Social Media', 'TV', 'Radio', 'Print', 'Search Ads', 'Influencer', 'Email', 'None']
const promFrequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Seasonal', 'None']

const emptyForm = {
  companyName: '', industry: '', productName: '', businessType: '',
  initialCapital: '', manufacturingCost: '', sellingPrice: '', operatingCost: '',
  initialInventory: '', productionCapacity: '', warehouseCapacity: '',
  marketingBudget: '', advertisingChannel: '', promotionFrequency: '',
}

export default function BusinessForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { setActiveBusiness, refreshBusinesses } = useActiveBusiness()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!id) return
    getBusiness(Number(id)).then(res => {
      if (res.success) {
        const b = res.data
        setForm({
          companyName: b.companyName, industry: b.industry, productName: b.productName,
          businessType: b.businessType, initialCapital: String(b.initialCapital),
          manufacturingCost: String(b.manufacturingCost), sellingPrice: String(b.sellingPrice),
          operatingCost: String(b.operatingCost), initialInventory: String(b.initialInventory),
          productionCapacity: String(b.productionCapacity), warehouseCapacity: String(b.warehouseCapacity),
          marketingBudget: String(b.marketingBudget), advertisingChannel: b.advertisingChannel,
          promotionFrequency: b.promotionFrequency,
        })
      } else {
        setError(res.error || 'Failed to load business')
      }
    }).finally(() => setFetching(false))
  }, [id])

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const payload = {
      ...form,
      initialCapital: Number(form.initialCapital),
      manufacturingCost: Number(form.manufacturingCost),
      sellingPrice: Number(form.sellingPrice),
      operatingCost: Number(form.operatingCost),
      initialInventory: Number(form.initialInventory),
      productionCapacity: Number(form.productionCapacity),
      warehouseCapacity: Number(form.warehouseCapacity),
      marketingBudget: Number(form.marketingBudget),
    }
    const res = isEdit
      ? await updateBusiness(Number(id), payload)
      : await createBusiness(payload)
    setLoading(false)
    if (res.success && res.data) {
      setActiveBusiness(res.data)
      await refreshBusinesses()
      navigate('/businesses')
    } else {
      setError(res.error || 'Failed to save business')
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={isEdit ? 'Edit business' : 'New business'}
        description="Define the company you want to simulate. Financials, capacity, and marketing shape every period."
      />

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Company information">
          <Field label="Company name">
            <Input value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
          </Field>
          <Field label="Industry">
            <Select value={form.industry} onChange={e => set('industry', e.target.value)} required>
              <option value="">Select...</option>
              {industries.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Product name">
            <Input value={form.productName} onChange={e => set('productName', e.target.value)} required />
          </Field>
          <Field label="Business type">
            <Select value={form.businessType} onChange={e => set('businessType', e.target.value)} required>
              <option value="">Select...</option>
              {businessTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </SectionCard>

        <SectionCard title="Financials">
          <Field label="Initial capital" hint="Cash on hand when the simulation starts">
            <Input type="number" min={0} value={form.initialCapital} onChange={e => set('initialCapital', e.target.value)} required />
          </Field>
          <Field label="Manufacturing cost per unit">
            <Input type="number" min={0} value={form.manufacturingCost} onChange={e => set('manufacturingCost', e.target.value)} required />
          </Field>
          <Field label="Selling price per unit">
            <Input type="number" min={0} value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} required />
          </Field>
          <Field label="Operating cost per period">
            <Input type="number" min={0} value={form.operatingCost} onChange={e => set('operatingCost', e.target.value)} required />
          </Field>
        </SectionCard>

        <SectionCard title="Inventory and capacity">
          <Field label="Initial inventory" hint="Units in stock at period one">
            <Input type="number" min={0} value={form.initialInventory} onChange={e => set('initialInventory', e.target.value)} required />
          </Field>
          <Field label="Production capacity per period">
            <Input type="number" min={0} value={form.productionCapacity} onChange={e => set('productionCapacity', e.target.value)} required />
          </Field>
          <Field label="Warehouse capacity" hint="Maximum units you can hold">
            <Input type="number" min={0} value={form.warehouseCapacity} onChange={e => set('warehouseCapacity', e.target.value)} required />
          </Field>
        </SectionCard>

        <SectionCard title="Marketing">
          <Field label="Marketing budget per period">
            <Input type="number" min={0} value={form.marketingBudget} onChange={e => set('marketingBudget', e.target.value)} required />
          </Field>
          <Field label="Advertising channel">
            <Select value={form.advertisingChannel} onChange={e => set('advertisingChannel', e.target.value)} required>
              <option value="">Select...</option>
              {adChannels.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Promotion frequency">
            <Select value={form.promotionFrequency} onChange={e => set('promotionFrequency', e.target.value)} required>
              <option value="">Select...</option>
              {promFrequencies.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </SectionCard>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update business' : 'Create business'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/businesses')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
