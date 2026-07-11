import type { CropListing, BuyerInterest } from '../types';

const images = [
  'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&q=80',
  'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=600&q=80',
  'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&q=80',
  'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80',
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
];

const crops = [
  { name: 'Alphonso Mangoes', cat: 'Fruits' as const },
  { name: 'Basmati Rice', cat: 'Grains' as const },
  { name: 'Red Chilli', cat: 'Spices' as const },
  { name: 'Tur Dal', cat: 'Pulses' as const },
  { name: 'Tomatoes', cat: 'Vegetables' as const },
  { name: 'Groundnut', cat: 'Oilseeds' as const },
  { name: 'Onions', cat: 'Vegetables' as const },
  { name: 'Turmeric', cat: 'Spices' as const },
];

const locations = ['Nashik, MH', 'Guntur, AP', 'Karnal, HR', 'Erode, TN', 'Indore, MP', 'Kolar, KA'];
const farmers = ['Ramesh Patil', 'Lakshmi Reddy', 'Suresh Yadav', 'Kavita Naik', 'Arjun Singh', 'Meena Devi'];
const statuses: CropListing['status'][] = ['available', 'available', 'available', 'reserved', 'sold'];

export function generateListings(count: number, offset = 0): CropListing[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = offset + i;
    const crop = crops[idx % crops.length];
    return {
      id: `listing-${idx}`,
      cropName: crop.name,
      category: crop.cat,
      quantity: 50 + ((idx * 37) % 950),
      unit: idx % 3 === 0 ? 'ton' : 'kg',
      pricePerUnit: 18 + ((idx * 13) % 82),
      harvestDate: new Date(Date.now() - ((idx * 5) % 60) * 86400000).toISOString(),
      location: locations[idx % locations.length],
      status: statuses[idx % statuses.length],
      imageUrl: images[idx % images.length],
      farmerName: farmers[idx % farmers.length],
      farmerId: `farmer-${idx % farmers.length}`,
      interestedCount: (idx * 3) % 12,
      postedAt: new Date(Date.now() - ((idx * 2) % 10) * 3600000).toISOString(),
      description: 'Freshly harvested, sorted and graded. Available for immediate pickup or delivery within region.',
    };
  });
}

export function generateInterests(listingId: string): BuyerInterest[] {
  const names = ['Vikram Traders', 'City Fresh Mart', 'Sunrise Wholesale', 'Green Basket Retail'];
  const roles = ['buyer', 'mediator', 'buyer', 'mediator'] as const;
  return names.map((n, i) => ({
    id: `${listingId}-int-${i}`,
    listingId,
    buyerName: n,
    buyerRole: roles[i],
    message: 'Interested in bulk purchase. Can you share quality grade and best price?',
    createdAt: new Date(Date.now() - i * 2 * 3600000).toISOString(),
    status: i === 0 ? 'accepted' : i === 3 ? 'rejected' : 'pending',
  }));
}
