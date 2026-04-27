import { useQuery } from '@tanstack/react-query';
import type { LocaleCode } from '@shared/index';
import { api } from '@/lib/api';
import { isBackendOfflineError } from '@/lib/api-state';
import { buildFallbackBootstrap } from '@/lib/public-fallback';

export const useSiteBootstrap = (locale: LocaleCode) =>
  useQuery({
    queryKey: ['bootstrap', locale],
    queryFn: () => api.getBootstrap(locale),
    staleTime: 60_000,
  });

export const usePublicBootstrap = (locale: LocaleCode) => {
  const query = useSiteBootstrap(locale);
  const backendOffline = isBackendOfflineError(query.error);

  return {
    ...query,
    backendOffline,
    data: query.data ?? buildFallbackBootstrap(locale),
  };
};

export const usePublicEvents = () =>
  useQuery({
    queryKey: ['events'],
    queryFn: () => api.listEvents(),
    staleTime: 60_000,
  });

export const usePublicEvent = (slug: string) =>
  useQuery({
    queryKey: ['event', slug],
    queryFn: () => api.getEvent(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });

export const useActiveAnnouncements = () =>
  useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.listAnnouncements(),
    staleTime: 30_000,
  });

export const useGlimpses = () =>
  useQuery({
    queryKey: ['glimpses'],
    queryFn: () => api.listGlimpses(),
    staleTime: 60_000,
  });

export const useGalleryCollections = () =>
  useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.listGallery(),
    staleTime: 60_000,
  });

export const useMediaCollections = () =>
  useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.listMediaCollections(),
    staleTime: 60_000,
  });

export const useFaqEntries = () =>
  useQuery({
    queryKey: ['faqs'],
    queryFn: () => api.listFaqs(),
    staleTime: 60_000,
  });

export const useSocialFeed = () =>
  useQuery({
    queryKey: ['social-feed'],
    queryFn: () => api.getSocialFeed(),
    staleTime: 120_000,
  });

export const useAdminSession = () =>
  useQuery({
    queryKey: ['admin-session'],
    queryFn: () => api.getAdminSession(),
    staleTime: 60_000,
  });

export const useAdminAnnouncements = (params?: { page?: number; pageSize?: number; search?: string; status?: string }) =>
  useQuery({
    queryKey: ['admin-announcements', params],
    queryFn: () => api.adminAnnouncements(params),
    staleTime: 30_000,
  });

export const useAdminGlimpses = () =>
  useQuery({
    queryKey: ['admin-glimpses'],
    queryFn: () => api.adminGlimpses(),
    staleTime: 30_000,
  });

export const useAdminMedia = (params?: { page?: number; pageSize?: number; search?: string }) =>
  useQuery({
    queryKey: ['admin-media', params],
    queryFn: () => api.adminMedia(params),
    staleTime: 30_000,
  });

export const useAdminFaqs = (params?: { page?: number; pageSize?: number; search?: string }) =>
  useQuery({
    queryKey: ['admin-faqs', params],
    queryFn: () => api.adminFaqs(params),
    staleTime: 30_000,
  });
