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
}

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
  status: ListingStatus;
  imageUrl: string;
  farmerName: string;
  farmerId: string;
  interestedCount: number;
  postedAt: string;
  description?: string;
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
}
