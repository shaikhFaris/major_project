const BASE = '/api';

let token: string | null = localStorage.getItem('token');

export function setAuthToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

export function getToken(): string | null {
  return token;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ success: boolean; data: T; error: string | null }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

// ── Auth ────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export function register(email: string, password: string, name: string) {
  return request<AuthResponse>('POST', '/auth/register', { email, password, name });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('POST', '/auth/login', { email, password });
}

export function getMe() {
  return request<User>('GET', '/auth/me');
}

// ── Businesses ──────────────────────────────────────────
export interface Business {
  id: number;
  userId: number;
  companyName: string;
  industry: string;
  productName: string;
  businessType: string;
  // decimal columns come back as strings from pg; create/update payloads send numbers
  initialCapital: string | number;
  manufacturingCost: string | number;
  sellingPrice: string | number;
  operatingCost: string | number;
  initialInventory: number;
  productionCapacity: number;
  warehouseCapacity: number;
  marketingBudget: string | number;
  advertisingChannel: string;
  promotionFrequency: string;
  createdAt: string;
}

export function createBusiness(data: Partial<Business>) {
  return request<Business>('POST', '/businesses', data);
}

export function listBusinesses() {
  return request<Business[]>('GET', '/businesses');
}

export function getBusiness(id: number) {
  return request<Business>('GET', `/businesses/${id}`);
}

export function updateBusiness(id: number, data: Partial<Business>) {
  return request<Business>('PUT', `/businesses/${id}`, data);
}

export function deleteBusiness(id: number) {
  return request<{ deleted: boolean }>('DELETE', `/businesses/${id}`);
}

// ── Market Configs ──────────────────────────────────────
export interface MarketConfig {
  id: number;
  businessId: number;
  marketSize: number;
  population: number;
  numCompetitors: number;
  demandLevel: string;
  economicCondition: string;
  inflation: string | number;
  season: string;
  customerIncome: string;
  taxRate: string | number;
  supplyAvailability: string;
  governmentPolicies: string | null;
}

export function createMarketConfig(data: Partial<MarketConfig>) {
  return request<MarketConfig>('POST', '/market-configs', data);
}

export function getMarketConfig(businessId: number) {
  return request<MarketConfig>('GET', `/market-configs?businessId=${businessId}`);
}

export function updateMarketConfig(id: number, data: Partial<MarketConfig>) {
  return request<MarketConfig>('PUT', `/market-configs/${id}`, data);
}

// ── Simulations ─────────────────────────────────────────
export interface Simulation {
  id: number;
  businessId: number;
  marketConfigId: number;
  strategyLabel: string | null;
  status: string;
  createdAt: string;
  businessName?: string;
}

export interface PeriodResult {
  period: number;
  demand: number;
  unitsSold: number;
  revenue: number;
  profit: number;
  cost: number;
  marketShare: number;
  inventoryLevel: number;
  consumerSatisfaction: number;
}

export function createSimulation(businessId: number, marketConfigId: number, strategyLabel?: string) {
  return request<Simulation>('POST', '/simulations', { businessId, marketConfigId, strategyLabel });
}

export function runSimulation(id: number) {
  return request<{ simulationId: number; results: PeriodResult[] }>('POST', `/simulations/${id}/run`);
}

export function getSimulationResults(id: number) {
  return request<PeriodResult[]>('GET', `/simulations/${id}/results`);
}

export function listSimulations() {
  return request<Simulation[]>('GET', '/simulations');
}

// ── Used-Car Market Platform ──────────────────────────────

export const ucApi = {
  audit:         ()       => request<any>('GET',  '/used-cars/audit'),
  market:        ()       => request<any>('GET',  '/used-cars/market'),
  demand:        (b: any) => request<any>('POST', '/used-cars/demand', b),
  geographic:    (p?: { transport_cost?: number; reconditioning_cost?: number; platform_fee_pct?: number }) => {
    const qs = p ? `?transport_cost=${p.transport_cost ?? 5000}&reconditioning_cost=${p.reconditioning_cost ?? 20000}&platform_fee_pct=${p.platform_fee_pct ?? 2}` : '';
    return request<any>('GET', `/used-cars/geographic${qs}`);
  },
  segments:      ()       => request<any>('GET',  '/used-cars/segments'),
  opportunity:   (b: any) => request<any>('POST', '/used-cars/opportunity', b),
  acquire:       (b: any) => request<any>('POST', '/used-cars/acquire', b),
  allocate:      (b: any) => request<any>('POST', '/used-cars/allocate', b),
  priceStrategy: (b: any) => request<any>('POST', '/used-cars/price-strategy', b),
  backtest:      (b: any) => request<any>('POST', '/used-cars/backtest', b),
  whatif:        (b: any) => request<any>('POST', '/used-cars/whatif', b),
  explain:       ()       => request<any>('GET',  '/used-cars/explain'),
  predictPrice:  (b: any) => request<any>('POST', '/used-cars/predict-price', b),

  // Inventory CRUD
  listInventory:   ()       => request<any[]>('GET',   '/used-cars/inventory'),
  addInventory:    (b: any) => request<any>  ('POST',  '/used-cars/inventory', b),
  updateInventory: (id: number, b: any) => request<any>('PATCH', `/used-cars/inventory/${id}`, b),
  deleteInventory: (id: number)         => request<any>('DELETE', `/used-cars/inventory/${id}`),

  // Strategy CRUD
  listStrategies:   ()       => request<any[]>('GET',    '/used-cars/strategies'),
  saveStrategy:     (b: any) => request<any>  ('POST',   '/used-cars/strategies', b),
  deleteStrategy:   (id: number)          => request<any>('DELETE', `/used-cars/strategies/${id}`),
};
