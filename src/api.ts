import type { OrderResponse, OrdersResponse } from './types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  let payload: { message?: string } | T;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`The API returned HTTP ${response.status}`);
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? payload.message
      : undefined;
    throw new Error(message ?? `The API returned HTTP ${response.status}`);
  }

  return payload as T;
}

export interface OrderFilters {
  page: number;
  pageSize: number;
  search: string;
  financialStatus: string;
  fulfillmentStatus: string;
  from: string;
  to: string;
}

export async function fetchOrders(filters: OrderFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.financialStatus) params.set('financialStatus', filters.financialStatus);
  if (filters.fulfillmentStatus) params.set('fulfillmentStatus', filters.fulfillmentStatus);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  return request<OrdersResponse>(`/orders?${params.toString()}`);
}

export function fetchOrder(id: string) {
  return request<OrderResponse>(`/orders/${encodeURIComponent(id)}`);
}

export interface SyncResponse {
  success: boolean;
  message: string;
  summary: {
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
    pages: number;
  };
}

export function syncOrders() {
  return request<SyncResponse>('/orders/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
