import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './client';
import type { CropListing, User } from '../types';
import { toast } from 'sonner';

export const qk = {
  listings: (filters: api.ListingFilters) => ['listings', filters] as const,
  listing: (id: string) => ['listing', id] as const,
  myListings: ['myListings'] as const,
  interests: (listingId: string) => ['interests', listingId] as const,
  users: ['admin-users'] as const,
  pesticides: (crop?: string) => ['pesticides', crop ?? 'All'] as const,
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

export function useMyListings(enabled: boolean) {
  return useQuery({ queryKey: qk.myListings, queryFn: () => api.fetchMyListings(), enabled });
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
      qc.invalidateQueries({ queryKey: qk.myListings });
      toast.success(`${newListing.cropName} listed successfully`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create listing.'),
  });
}

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CropListing['status'] }) => api.updateListingStatus(id, status),
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
    onError: (err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(err instanceof Error ? err.message : 'Could not update status');
    },
    onSuccess: (_data, vars) => toast.success(`Marked as ${vars.status}`),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: qk.myListings });
    },
  });
}

export function useCreateInterest(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.createInterest(listingId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.interests(listingId) });
      qc.invalidateQueries({ queryKey: qk.listing(listingId) });
      toast.success('Interest sent to the farmer');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not send interest.'),
  });
}

export function useRequestOtp() {
  return useMutation({ mutationFn: api.requestOtp });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ phone, otp, role, name }: { phone: string; otp: string; role: string; name?: string }) =>
      api.verifyOtp(phone, otp, role, name),
  });
}

// ---- Admin ----
export function useAllUsers(enabled: boolean) {
  return useQuery({ queryKey: qk.users, queryFn: api.fetchAllUsers, enabled });
}

export function usePromoteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => api.updateUserRole(id, role),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: qk.users });
      toast.success(`${user.name} is now ${user.role}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update role.'),
  });
}

// ---- Pesticide prices ----
export function usePesticidePrices(crop?: string) {
  return useQuery({ queryKey: qk.pesticides(crop), queryFn: () => api.fetchPesticidePrices(crop) });
}
