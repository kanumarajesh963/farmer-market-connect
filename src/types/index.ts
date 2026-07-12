export type UserRole = 'farmer' | 'buyer' | 'mediator' | 'admin';

// Roles a person can choose for themselves at signup. 'admin' is deliberately
// excluded — it can only ever be granted by an existing admin.
export const SELECTABLE_ROLES: Exclude<UserRole, 'admin'>[] = ['farmer', 'buyer', 'mediator'];

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email?: string;
  location: string;
  avatarColor: string;
  // Populated by the backend when available. Optional because this app's
  // current API doesn't emit them yet — the UI degrades gracefully to "—"
  // wherever these are missing instead of guessing.
  lastLoginAt?: string;
  loginCount?: number;
  createdAt?: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'te';

export type ListingStatus = 'available' | 'reserved' | 'sold';
export type CropCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Grains'
  | 'Pulses'
  | 'Spices'
  | 'Oilseeds';
export type QuantityUnit = 'kg' | 'ton';

export interface CropListing {
  id: string;
  cropName: string;
  category: CropCategory;
  quantity: number;
  unit: QuantityUnit;
  pricePerUnit: number;
  harvestDate: string;
  location: string;
  // Optional map link (Google Maps / Plus Code / any URL) pointing at the
  // farm or pickup point, shown as a "Get directions" link on the listing.
  locationUrl?: string;
  status: ListingStatus;
  // One or more photos of the crop. images[0] is the cover photo shown on
  // cards; the full set is shown in the gallery on the detail page.
  images: string[];
  farmerName: string;
  farmerId: string;
  interestedCount: number;
  postedAt: string;
  description?: string;
  // Why the farmer is selling this batch (surplus, end of season, etc.) —
  // shown on the listing and on the farmer's profile.
  sellReason?: string;
}

export interface BuyerInterest {
  id: string;
  listingId: string;
  buyerName: string;
  buyerRole: UserRole;
  message: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PesticidePrice {
  id: string;
  name: string;
  cropCategory: CropCategory | 'All';
  applicableCrops: string[];
  pricePerUnit: number;
  unit: string;
  updatedAt: string;
  // Richer detail fields for the pesticide detail page. Optional because
  // the current API doesn't return them yet — the detail page falls back
  // to general safety guidance when a product doesn't have these.
  imageUrl?: string;
  activeIngredient?: string;
  manufacturer?: string;
  dosage?: string;
  usageNotes?: string;
  safetyNotes?: string;
}
