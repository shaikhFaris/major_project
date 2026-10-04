import { Routes, Route, Navigate } from "react-router-dom";
import { ChartLineUp } from "@phosphor-icons/react";
import { AuthProvider, useAuth } from "./lib/auth";
import { BusinessProvider } from "./lib/businessContext";
import Layout from "./components/Layout";

// ── Auth ───────────────────────────────────────────────────────────────────
import Login from "./pages/Login";
import Register from "./pages/Register";

// ── General Platform ───────────────────────────────────────────────────────
import Dashboard from "./pages/Dashboard";
import BusinessForm from "./pages/BusinessForm";
import BusinessList from "./pages/BusinessList";
import MarketConfigForm from "./pages/MarketConfigForm";
import DataUploadValidation from "./pages/DataUploadValidation";
import ModelEvaluation from "./pages/ModelEvaluation";
import StrategyBuilder from "./pages/StrategyBuilder";
import Simulations from "./pages/Simulations";
import SimulationResults from "./pages/SimulationResults";
import StrategyComparison from "./pages/StrategyComparison";
import CarPrediction from "./pages/CarPrediction";
import BusinessRequired from "./components/BusinessRequired";

// ── Used-Car Reseller Platform ─────────────────────────────────────────────
import UsedCarDashboard from "./pages/UsedCarDashboard";
import DataAudit from "./pages/DataAudit";
import MarketAnalysis from "./pages/MarketAnalysis";
import DemandAnalysis from "./pages/DemandAnalysis";
import OpportunityFinder from "./pages/OpportunityFinder";
import AcquisitionStrategy from "./pages/AcquisitionStrategy";
import InventoryAllocator from "./pages/InventoryAllocator";
import InventoryManagement from "./pages/InventoryManagement";
import RiskDashboard from "./pages/RiskDashboard";
import PricingStrategy from "./pages/PricingStrategy";
import GeographicAnalysis from "./pages/GeographicAnalysis";
import StrategyBacktest from "./pages/StrategyBacktest";
import WhatIfSimulator from "./pages/WhatIfSimulator";
import MlExplainability from "./pages/MlExplainability";

// ── Loading screen ─────────────────────────────────────────────────────────
function AppLoading() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-zinc-950">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center animate-pulse border border-emerald-500/30">
        <ChartLineUp size={24} weight="bold" />
      </div>
      <p className="text-sm font-semibold text-zinc-400">Loading Market Sim Platform...</p>
    </div>
  );
}

// ── Route guards ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AppLoading />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected shell */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>

            {/* ── General Platform ── */}
            <Route index element={<Dashboard />} />
            <Route path="data-upload" element={<DataUploadValidation />} />
            <Route path="market-model" element={<BusinessRequired><ModelEvaluation /></BusinessRequired>} />
            <Route path="strategy-builder" element={<BusinessRequired><StrategyBuilder /></BusinessRequired>} />
            <Route path="simulations" element={<BusinessRequired><Simulations /></BusinessRequired>} />
            <Route path="simulations/results" element={<BusinessRequired><SimulationResults /></BusinessRequired>} />
            <Route path="simulations/compare" element={<BusinessRequired><StrategyComparison /></BusinessRequired>} />
            <Route path="cars" element={<CarPrediction />} />
            <Route path="businesses" element={<BusinessList />} />
            <Route path="businesses/new" element={<BusinessForm />} />
            <Route path="businesses/:id/edit" element={<BusinessForm />} />
            <Route path="businesses/:id/market-config" element={<MarketConfigForm />} />

            {/* ── Used-Car Reseller Platform ── */}
            <Route path="used-cars" element={<UsedCarDashboard />} />
            <Route path="used-cars/audit" element={<DataAudit />} />
            <Route path="used-cars/market" element={<MarketAnalysis />} />
            <Route path="used-cars/demand" element={<DemandAnalysis />} />
            <Route path="used-cars/opportunity" element={<OpportunityFinder />} />
            <Route path="used-cars/acquire" element={<AcquisitionStrategy />} />
            <Route path="used-cars/allocate" element={<InventoryAllocator />} />
            <Route path="used-cars/inventory" element={<InventoryManagement />} />
            <Route path="used-cars/price-strategy" element={<PricingStrategy />} />
            <Route path="used-cars/geographic" element={<GeographicAnalysis />} />
            <Route path="used-cars/backtest" element={<StrategyBacktest />} />
            <Route path="used-cars/whatif" element={<WhatIfSimulator />} />
            <Route path="used-cars/risk" element={<RiskDashboard />} />
            <Route path="used-cars/explain" element={<MlExplainability />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BusinessProvider>
    </AuthProvider>
  );
}
