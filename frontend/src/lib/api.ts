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
