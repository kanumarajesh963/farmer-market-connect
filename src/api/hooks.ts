import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './client';
import type { CropListing } from '../types';
import { toast } from 'sonner';

export const qk = {
  listings: (filters: api.ListingFilters) => ['listings', filters] as const,
  listing: (id: string) => ['listing', id] as const,
  myListings: (farmerId: string) => ['myListings', farmerId] as const,
  interests: (listingId: string) => ['interests', listingId] as const,
};

export function useListingsInfinite(filters: api.ListingFilters) {
  return useInfiniteQuery({
    queryKey: qk.listings(filters),
    queryFn: ({ pageParam }) => api.fetchListings(pageParam, 8, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useListing(id: string) {
  return useQuery({ queryKey: qk.listing(id), queryFn: () => api.fetchListingById(id), enabled: !!id });
}

export function useMyListings(farmerId: string) {
  return useQuery({ queryKey: qk.myListings(farmerId), queryFn: () => api.fetchMyListings(farmerId) });
}

export function useInterests(listingId: string) {
  return useQuery({ queryKey: qk.interests(listingId), queryFn: () => api.fetchInterests(listingId), enabled: !!listingId });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createListing,
    onSuccess: (newListing) => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: qk.myListings('current-farmer') });
      toast.success(`${newListing.cropName} listed successfully`);
    },
    onError: () => toast.error('Could not create listing. Please try again.'),
  });
}

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CropListing['status'] }) => api.updateListingStatus(id, status),
    // Optimistic update
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['listings'] });
      const previous = qc.getQueriesData({ queryKey: ['listings'] });
      qc.setQueriesData({ queryKey: ['listings'] }, (old: unknown) => {
        const data = old as { pages: api.ListingPage[]; pageParams: unknown[] } | undefined;
        if (!data) return old;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((l) => (l.id === id ? { ...l, status } : l)),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Could not update status');
    },
    onSuccess: (_data, vars) => toast.success(`Marked as ${vars.status}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  });
}

export function useRequestOtp() {
  return useMutation({ mutationFn: api.requestOtp });
}

export function useVerifyOtp() {
  return useMutation({ mutationFn: ({ phone, otp }: { phone: string; otp: string }) => api.verifyOtp(phone, otp) });
}
