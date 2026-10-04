import { useEffect, useState } from "react";
import { Storefront, Plus, Trash, PencilSimple, CheckCircle } from "@phosphor-icons/react";
import { ucApi } from "../lib/api";
import { PageHeader, Card, Skeleton, ErrorBanner, Input, Button, Badge, Field, Select, EmptyState } from "../components/ui";

const statusColors: Record<string, "emerald" | "sky" | "zinc"> = {
  in_inventory: "sky",
  listed: "amber" as any,
  sold: "emerald",
};

export default function InventoryManagement() {
  const [items, setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    make: "", model: "", variant: "", makeYear: 2022, mileage: 50000,
    fuelType: "petrol", bodyType: "hatchback", transmission: "manual",
    noOfOwners: 1, city: "delhi-ncr", acquisitionPrice: "",
    targetSellingPrice: "", reconditioningCost: 20000, notes: "",
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const load = () => {
    setLoading(true);
    ucApi.listInventory()
      .then(r => { if (r.success) setItems(r.data ?? []); else setError(r.error); })
      .catch(() => setError("Backend unreachable"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.make || !form.model || !form.acquisitionPrice) return;
    setSaving(true);
    try {
      const r = await ucApi.addInventory({ ...form, acquisitionPrice: Number(form.acquisitionPrice), targetSellingPrice: form.targetSellingPrice ? Number(form.targetSellingPrice) : null });
      if (r.success) { setShowForm(false); load(); }
      else setError(r.error);
    } catch { setError("Failed to add vehicle"); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const patch: any = { status };
    if (status === "sold") patch.soldAt = new Date().toISOString();
    if (status === "listed") patch.listedAt = new Date().toISOString();
    await ucApi.updateInventory(id, patch);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this vehicle from inventory?")) return;
    await ucApi.deleteInventory(id);
    load();
  };

  const totalAcquisition = items.reduce((s, v) => s + parseFloat(v.acquisitionPrice ?? 0), 0);
  const totalTarget = items.filter(v => v.targetSellingPrice).reduce((s, v) => s + parseFloat(v.targetSellingPrice ?? 0), 0);
  const soldItems = items.filter(v => v.status === "sold");
  const totalRealised = soldItems.reduce((s, v) => s + parseFloat(v.soldPrice ?? v.targetSellingPrice ?? 0), 0);

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Inventory Manager"
        description="Track vehicles you have purchased, their acquisition cost, target selling price, and current status."
        actions={<Button onClick={() => setShowForm(s => !s)}><Plus size={14} weight="bold" /> Add Vehicle</Button>}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Vehicles",     value: items.length },
          { label: "In Inventory",       value: items.filter(v => v.status === "in_inventory").length },
          { label: "Capital Deployed",   value: `₹${(totalAcquisition / 100000).toFixed(1)}L` },
          { label: "Sold Vehicles",      value: soldItems.length },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-[10px] text-zinc-500 uppercase font-medium">{s.label}</p>
            <p className="text-xl font-black font-mono text-zinc-100 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Add Vehicle Form */}
      {showForm && (
        <Card className="p-5 border-emerald-500/20">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">Add Vehicle to Inventory</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <Field label="Brand *"><Input value={form.make} onChange={e => set("make", e.target.value)} placeholder="e.g. Maruti Suzuki" /></Field>
            <Field label="Model *"><Input value={form.model} onChange={e => set("model", e.target.value)} placeholder="e.g. Swift" /></Field>
            <Field label="Variant"><Input value={form.variant} onChange={e => set("variant", e.target.value)} placeholder="e.g. VXi" /></Field>
            <Field label="Make Year">
              <Input type="number" value={form.makeYear} onChange={e => set("makeYear", Number(e.target.value))} />
            </Field>
            <Field label="Mileage (km)">
              <Input type="number" value={form.mileage} onChange={e => set("mileage", Number(e.target.value))} />
            </Field>
            <Field label="Fuel Type">
              <Select value={form.fuelType} onChange={e => set("fuelType", e.target.value)}>
                {["petrol","diesel","cng","hybrid"].map(f => <option key={f} value={f}>{f}</option>)}
              </Select>
            </Field>
            <Field label="Body Type">
              <Select value={form.bodyType} onChange={e => set("bodyType", e.target.value)}>
                {["hatchback","sedan","suv","muv","crossover"].map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="Transmission">
              <Select value={form.transmission} onChange={e => set("transmission", e.target.value)}>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </Select>
            </Field>
            <Field label="No. of Owners">
              <Select value={form.noOfOwners} onChange={e => set("noOfOwners", Number(e.target.value))}>
                <option value={1}>1st Owner</option>
                <option value={2}>2nd Owner</option>
                <option value={3}>3rd Owner</option>
              </Select>
            </Field>
            <Field label="City">
              <Select value={form.city} onChange={e => set("city", e.target.value)}>
                {["delhi-ncr","hyderabad","bangalore","mumbai","pune","ahmedabad","chennai","kolkata","jaipur"].map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Acquisition Price (₹) *">
              <Input type="number" value={form.acquisitionPrice} onChange={e => set("acquisitionPrice", e.target.value)} placeholder="e.g. 450000" />
            </Field>
            <Field label="Target Selling Price (₹)">
              <Input type="number" value={form.targetSellingPrice} onChange={e => set("targetSellingPrice", e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Reconditioning Cost (₹)">
              <Input type="number" value={form.reconditioningCost} onChange={e => set("reconditioningCost", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Notes">
            <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes…" />
          </Field>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add to Inventory"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Inventory Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Storefront size={24} />}
          title="No vehicles in inventory"
          description="Add your first vehicle to start tracking your used-car portfolio."
          action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Add Vehicle</Button>}
        />
      ) : (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Vehicle", "Year / Mileage", "City", "Acq. Price", "Target Price", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-zinc-500 font-semibold py-2 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((v: any) => (
                  <tr key={v.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 pr-4">
                      <p className="text-zinc-100 font-bold">{v.make} {v.model}</p>
                      <p className="text-zinc-500 text-[10px]">{v.variant} · {v.fuelType} · {v.transmission}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-zinc-300">{v.makeYear}<br /><span className="text-zinc-500">{Number(v.mileage).toLocaleString()} km</span></td>
                    <td className="py-3 pr-4 text-zinc-300 capitalize">{v.city}</td>
                    <td className="py-3 pr-4 text-zinc-200 font-mono font-bold">₹{(parseFloat(v.acquisitionPrice) / 100000).toFixed(1)}L</td>
                    <td className="py-3 pr-4 text-zinc-300 font-mono">{v.targetSellingPrice ? `₹${(parseFloat(v.targetSellingPrice) / 100000).toFixed(1)}L` : "—"}</td>
                    <td className="py-3 pr-4">
                      <Select value={v.status} onChange={e => handleStatusChange(v.id, e.target.value)} className="w-32 text-xs py-1">
                        <option value="in_inventory">In Inventory</option>
                        <option value="listed">Listed</option>
                        <option value="sold">Sold</option>
                      </Select>
                    </td>
                    <td className="py-3 pr-4">
                      <button onClick={() => handleDelete(v.id)} className="text-zinc-500 hover:text-red-400 transition">
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
