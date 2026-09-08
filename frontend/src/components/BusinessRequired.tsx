import { Link } from "react-router-dom";
import { Buildings, Plus } from "@phosphor-icons/react";
import { useActiveBusiness } from "../lib/businessContext";

export default function BusinessRequired({ children }: { children: React.ReactNode }) {
  const { activeBusiness, loading } = useActiveBusiness();

  if (loading) return <div className="p-12 text-center text-zinc-400">Loading business projects...</div>;
  if (!activeBusiness) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-lg w-full text-center border border-dashed border-zinc-800 rounded-2xl px-6 py-16">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Buildings size={28} weight="bold" /></div>
          <h1 className="mt-6 text-2xl font-bold text-zinc-100">Add a business project first</h1>
          <p className="mt-2 text-zinc-400">Your model, strategies, results, and comparisons will use the business data you add.</p>
          <Link to="/businesses/new" className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm"><Plus size={18} weight="bold" /> Create business</Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}