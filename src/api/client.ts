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

// The frontend was upgraded to a multi-photo `images: string[]` field, but
// this app's live backend (server/) hasn't been redeployed with a matching
// change yet — it still returns the older single `imageUrl` string. Rather
// than crash on every listing, normalize whatever shape comes back into the
// new one. Once the backend adds `images`/`locationUrl`/`sellReason`
// natively, this keeps working unchanged (it just prefers the new fields).
type RawListing = Omit<CropListing, 'images'> & { images?: string[]; imageUrl?: string };

function normalizeListing(raw: RawListing): CropListing {
  const images = raw.images?.length ? raw.images : raw.imageUrl ? [raw.imageUrl] : [];
  return { ...raw, images };
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
  const page = await request<{ items: RawListing[]; nextCursor: number | null; total: number }>(
    `/api/listings?${filtersToQuery(filters, cursor, pageSize)}`
  );
  return { ...page, items: page.items.map(normalizeListing) };
}

export async function fetchListingById(id: string): Promise<CropListing | undefined> {
  const raw = await request<RawListing | undefined>(`/api/listings/${id}`);
  return raw ? normalizeListing(raw) : undefined;
}

export async function fetchMyListings(): Promise<CropListing[]> {
  const raw = await request<RawListing[]>('/api/listings/mine');
  return raw.map(normalizeListing);
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
  // Send both the new `images` array and a legacy `imageUrl` (its first
  // photo) in the same request. An old backend that only knows `imageUrl`
  // will pick that up and work exactly as before; a backend already
  // upgraded to store `images` will just ignore the extra field.
  const body = { ...payload, imageUrl: payload.images[0] };
  const raw = await request<RawListing>('/api/listings', { method: 'POST', body: JSON.stringify(body) });
  return normalizeListing(raw);
}

export async function updateListingStatus(id: string, status: CropListing['status']): Promise<CropListing> {
  const raw = await request<RawListing>(`/api/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  return normalizeListing(raw);
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
