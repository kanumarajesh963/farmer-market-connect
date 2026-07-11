import type { CropListing, BuyerInterest, CropCategory } from '../types';
import { generateListings, generateInterests } from './mockData';

const delay = (ms = 500) => new Promise((res) => setTimeout(res, ms));

const ALL_LISTINGS = generateListings(48);

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

export async function fetchListings(cursor = 0, pageSize = 8, filters: ListingFilters = {}): Promise<ListingPage> {
  await delay(600);
  let data = ALL_LISTINGS;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter((l) => l.cropName.toLowerCase().includes(q) || l.location.toLowerCase().includes(q));
  }
  if (filters.category && filters.category !== 'All') {
    data = data.filter((l) => l.category === filters.category);
  }
  if (filters.minPrice != null) data = data.filter((l) => l.pricePerUnit >= filters.minPrice!);
  if (filters.maxPrice != null) data = data.filter((l) => l.pricePerUnit <= filters.maxPrice!);
  if (filters.minQuantity != null) data = data.filter((l) => l.quantity >= filters.minQuantity!);

  const items = data.slice(cursor, cursor + pageSize);
  const nextCursor = cursor + pageSize < data.length ? cursor + pageSize : null;
  return { items, nextCursor, total: data.length };
}

export async function fetchListingById(id: string): Promise<CropListing | undefined> {
  await delay(300);
  return ALL_LISTINGS.find((l) => l.id === id);
}

export async function fetchMyListings(farmerId: string): Promise<CropListing[]> {
  await delay(400);
  return ALL_LISTINGS.filter((l) => l.farmerId === farmerId).slice(0, 6);
}

export async function fetchInterests(listingId: string): Promise<BuyerInterest[]> {
  await delay(400);
  return generateInterests(listingId);
}

let idCounter = 1000;
export async function createListing(payload: Omit<CropListing, 'id' | 'postedAt' | 'interestedCount' | 'farmerName' | 'farmerId'>): Promise<CropListing> {
  await delay(900);
  const newListing: CropListing = {
    ...payload,
    id: `listing-new-${idCounter++}`,
    postedAt: new Date().toISOString(),
    interestedCount: 0,
    farmerName: 'You',
    farmerId: 'current-farmer',
  };
  ALL_LISTINGS.unshift(newListing);
  return newListing;
}

export async function updateListingStatus(id: string, status: CropListing['status']): Promise<void> {
  await delay(350);
  const l = ALL_LISTINGS.find((x) => x.id === id);
  if (l) l.status = status;
}

export async function requestOtp(phone: string): Promise<{ sent: boolean }> {
  await delay(700);
  if (phone.length < 10) throw new Error('Invalid phone number');
  return { sent: true };
}

export async function verifyOtp(phone: string, otp: string): Promise<{ token: string }> {
  await delay(700);
  if (otp !== '1234') throw new Error('Invalid OTP. Use 1234 for this demo.');
  return { token: `mock-jwt-${phone}` };
}
