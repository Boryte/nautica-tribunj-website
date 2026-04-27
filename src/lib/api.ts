import type {
  AnnouncementDTO,
  AdminLoginChallengeDTO,
  AdminTwoFactorSetupDTO,
  ApiResponse,
  AdminSessionDTO,
  BootstrapPayload,
  ContactSubmissionResultDTO,
  EventDTO,
  FaqEntryDTO,
  GalleryCollectionDTO,
  GlimpseGroupDTO,
  LocaleCode,
  MediaAssetDTO,
  MenuItemDTO,
  PaginatedResult,
  ReservationDTO,
  SocialFeedDTO,
  SiteSettingsDTO,
} from '@shared/index';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '')
  : '';

export const buildApiUrl = (path: string) => {
  if (/^(?:[a-z]+:)?\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
};

export class ApiClientError extends Error {
  code: string;
  fieldErrors?: Record<string, string[]>;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, fieldErrors?: Record<string, string[]>, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch {
    throw new ApiClientError('Unable to reach the API. Verify that the local backend is running.', 'NETWORK_ERROR');
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    if (!response.ok) {
      throw new ApiClientError(`Request failed with status ${response.status}.`, 'HTTP_ERROR');
    }
    throw new ApiClientError('The API returned an unreadable response.', 'INVALID_RESPONSE');
  }

  if (!response.ok || !payload.ok) {
    throw new ApiClientError(payload.error.message, payload.error.code, payload.error.fieldErrors, payload.error.details);
  }

  return payload.data;
}

export const api = {
  getBootstrap(locale: LocaleCode) {
    return request<BootstrapPayload>(`/api/bootstrap?locale=${locale}`);
  },
  listEvents() {
    return request<EventDTO[]>('/api/events');
  },
  getEvent(slug: string) {
    return request<EventDTO>(`/api/events/${slug}`);
  },
  listAnnouncements() {
    return request<AnnouncementDTO[]>('/api/announcements/active');
  },
  listGlimpses() {
    return request<GlimpseGroupDTO[]>('/api/glimpses');
  },
  listGallery() {
    return request<GalleryCollectionDTO[]>('/api/gallery');
  },
  listMediaCollections() {
    return request<GalleryCollectionDTO[]>('/api/gallery');
  },
  listFaqs() {
    return request<FaqEntryDTO[]>('/api/faqs');
  },
  listMedia() {
    return request<MediaAssetDTO[]>('/api/media');
  },
  getSocialFeed() {
    return request<SocialFeedDTO>('/api/social-feed');
  },
  sendWebVital(body: {
    name: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    navigationType?: string;
    pageUrl: string;
    locale?: LocaleCode;
  }) {
    return request<{ accepted: boolean }>('/api/observability/web-vitals', {
      method: 'POST',
      body: JSON.stringify(body),
      keepalive: true,
    });
  },
  getAdminSession() {
    return request<AdminSessionDTO>('/api/admin/session');
  },
  createReservation(body: Record<string, unknown>) {
    return request<ReservationDTO>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  createContactMessage(body: Record<string, unknown>) {
    return request<ContactSubmissionResultDTO>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  registerForEvent(eventId: number, body: Record<string, unknown>) {
    return request<{ status: string }>(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getAdminLoginChallenge() {
    return request<AdminLoginChallengeDTO>('/api/admin/auth/challenge');
  },
  getAdminTwoFactorSetup() {
    return request<AdminTwoFactorSetupDTO>('/api/admin/security/2fa/setup');
  },
  adminLogin(body: {
    email: string;
    password: string;
    deviceId: string;
    challengeId: string;
    challengeAnswer: string;
    oneTimeCode?: string;
  }) {
    return request<AdminSessionDTO>('/api/admin/login', {
      method: 'POST',
      headers: { 'x-admin-device-id': body.deviceId },
      body: JSON.stringify(body),
    });
  },
  adminLogout(csrfToken: string) {
    return request<{ loggedOut: boolean }>('/api/admin/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
    });
  },
  adminDashboard() {
    return request<{
      reservations: ReservationDTO[];
      events: EventDTO[];
      announcements: AnnouncementDTO[];
      mediaCount: number;
      faqCount: number;
    }>('/api/admin/dashboard');
  },
  adminReservations(params?: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    return request<PaginatedResult<ReservationDTO>>(`/api/admin/reservations?${searchParams.toString()}`);
  },
  adminEvents(params?: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    return request<PaginatedResult<EventDTO>>(`/api/admin/events?${searchParams.toString()}`);
  },
  adminMenu(params?: { page?: number; pageSize?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    return request<PaginatedResult<MenuItemDTO>>(`/api/admin/menu?${searchParams.toString()}`);
  },
  adminAnnouncements(params?: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    return request<PaginatedResult<AnnouncementDTO>>(`/api/admin/announcements?${searchParams.toString()}`);
  },
  adminGlimpses() {
    return request<GlimpseGroupDTO[]>('/api/admin/glimpses');
  },
  adminMedia(params?: { page?: number; pageSize?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    return request<{ assets: PaginatedResult<MediaAssetDTO>; collections: GalleryCollectionDTO[] }>(`/api/admin/media?${searchParams.toString()}`);
  },
  adminFaqs(params?: { page?: number; pageSize?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    return request<PaginatedResult<FaqEntryDTO>>(`/api/admin/faqs?${searchParams.toString()}`);
  },
  updateReservationStatus(id: number, body: { status: string; adminNotes?: string }, csrfToken: string) {
    return request<ReservationDTO>(`/api/admin/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  upsertEvent(body: Record<string, unknown>, csrfToken: string, id?: number) {
    return request<EventDTO>(id ? `/api/admin/events/${id}` : '/api/admin/events', {
      method: id ? 'PUT' : 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  upsertMenuItem(body: Record<string, unknown>, csrfToken: string) {
    return request<{ id: number }>('/api/admin/menu', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  updateSettings(body: SiteSettingsDTO, csrfToken: string) {
    return request<SiteSettingsDTO>('/api/admin/settings', {
      method: 'PUT',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  upsertAnnouncement(body: Record<string, unknown>, csrfToken: string) {
    return request<AnnouncementDTO>('/api/admin/announcements', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  deleteAnnouncement(id: number, csrfToken: string) {
    return request<{ deleted: boolean }>(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrfToken },
    });
  },
  upsertGlimpseGroup(body: Record<string, unknown>, csrfToken: string) {
    return request<GlimpseGroupDTO>('/api/admin/glimpses/groups', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  upsertGlimpseSlide(body: Record<string, unknown>, csrfToken: string) {
    return request('/api/admin/glimpses/slides', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  uploadMedia(formData: FormData, csrfToken: string) {
    return fetch(buildApiUrl('/api/admin/media/upload'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': csrfToken },
      body: formData,
    }).then(async (response) => {
      const payload = (await response.json()) as ApiResponse<MediaAssetDTO[]>;
      if (!payload.ok) throw new ApiClientError(payload.error.message, payload.error.code, payload.error.fieldErrors);
      return payload.data;
    });
  },
  updateMedia(id: number, body: Record<string, unknown>, csrfToken: string) {
    return request<MediaAssetDTO>(`/api/admin/media/${id}`, {
      method: 'PUT',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  deleteMedia(id: number, csrfToken: string) {
    return request<{ deleted: boolean }>(`/api/admin/media/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrfToken },
    });
  },
  upsertFaq(body: Record<string, unknown>, csrfToken: string) {
    return request<FaqEntryDTO>('/api/admin/faqs', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(body),
    });
  },
  deleteFaq(id: number, csrfToken: string) {
    return request<{ deleted: boolean }>(`/api/admin/faqs/${id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrfToken },
    });
  },
};
