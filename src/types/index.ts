export type UserRole = 'farmer' | 'buyer' | 'mediator' | 'admin';

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
