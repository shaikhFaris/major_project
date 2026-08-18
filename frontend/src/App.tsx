import { Routes, Route, Navigate } from "react-router-dom";
import { ChartLineUp } from "@phosphor-icons/react";
import { AuthProvider, useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BusinessForm from "./pages/BusinessForm";
import BusinessList from "./pages/BusinessList";
import MarketConfigForm from "./pages/MarketConfigForm";
import DataUploadValidation from "./pages/DataUploadValidation";
import ModelEvaluation from "./pages/ModelEvaluation";
import StrategyBuilder from "./pages/StrategyBuilder";
import SimulationResults from "./pages/SimulationResults";
import StrategyComparison from "./pages/StrategyComparison";

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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="data-upload" element={<DataUploadValidation />} />
          <Route path="market-model" element={<ModelEvaluation />} />
          <Route path="strategy-builder" element={<StrategyBuilder />} />
          <Route path="simulations/results" element={<SimulationResults />} />
          <Route path="simulations/compare" element={<StrategyComparison />} />
          <Route path="businesses" element={<BusinessList />} />
          <Route path="businesses/new" element={<BusinessForm />} />
          <Route path="businesses/:id/edit" element={<BusinessForm />} />
          <Route path="businesses/:id/market-config" element={<MarketConfigForm />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
