import type { CropListing, BuyerInterest, CropCategory, User, PesticidePrice } from '../types';
import { useAuthStore } from '../store/authStore';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Session expired / invalid — force a clean logout so the UI doesn't
    // sit in a broken half-authenticated state.
    useAuthStore.getState().logout();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? 'Something went wrong.', res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface ListingFilters {
  search?: string;
  category?: CropCategory | 'All';
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
}

export interface ListingPage {
  items: CropListing[];
  nextCursor: number | null;
  total: number;
}

function filtersToQuery(filters: ListingFilters, cursor: number, pageSize: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minQuantity != null) params.set('minQuantity', String(filters.minQuantity));
  params.set('cursor', String(cursor));
  params.set('pageSize', String(pageSize));
  return params.toString();
}

export async function fetchListings(cursor = 0, pageSize = 8, filters: ListingFilters = {}): Promise<ListingPage> {
  return request(`/api/listings?${filtersToQuery(filters, cursor, pageSize)}`);
}

export async function fetchListingById(id: string): Promise<CropListing | undefined> {
  return request(`/api/listings/${id}`);
}

export async function fetchMyListings(): Promise<CropListing[]> {
  return request('/api/listings/mine');
}

export async function fetchInterests(listingId: string): Promise<BuyerInterest[]> {
  return request(`/api/listings/${listingId}/interests`);
}

export async function createInterest(listingId: string, message: string): Promise<BuyerInterest> {
  return request(`/api/listings/${listingId}/interests`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function createListing(
  payload: Omit<CropListing, 'id' | 'postedAt' | 'interestedCount' | 'farmerName' | 'farmerId'>
): Promise<CropListing> {
  return request('/api/listings', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateListingStatus(id: string, status: CropListing['status']): Promise<CropListing> {
  return request(`/api/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function requestOtp(phone: string): Promise<{ sent: boolean; devOtp?: string }> {
  return request('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) });
}

export async function verifyOtp(
  phone: string,
  otp: string,
  role: string,
  name?: string
): Promise<{ token: string; user: User }> {
  return request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp, role, name }) });
}

export async function fetchMe(): Promise<{ user: User }> {
  return request('/api/auth/me');
}

// ---- Admin ----
export async function fetchAllUsers(): Promise<User[]> {
  return request('/api/admin/users');
}

export async function updateUserRole(id: string, role: User['role']): Promise<User> {
  return request(`/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

// ---- Pesticide prices ----
export async function fetchPesticidePrices(crop?: string): Promise<PesticidePrice[]> {
  const q = crop && crop !== 'All' ? `?crop=${encodeURIComponent(crop)}` : '';
  return request(`/api/pesticides${q}`);
}

export { ApiError };
