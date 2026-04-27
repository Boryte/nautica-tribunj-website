export const locales = ['hr', 'en'] as const;
export type LocaleCode = (typeof locales)[number];

export const reservationStatuses = [
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
  'no_show',
  'waitlist',
] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];

export const reservationAreas = ['terrace', 'indoor', 'bar', 'vip'] as const;
export type ReservationArea = (typeof reservationAreas)[number];

export const eventStatuses = ['draft', 'published', 'cancelled', 'archived'] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const eventRegistrationStatuses = ['registered', 'waitlist', 'cancelled'] as const;
export type EventRegistrationStatus = (typeof eventRegistrationStatuses)[number];

export const announcementStatuses = ['draft', 'scheduled', 'active', 'expired'] as const;
export type AnnouncementStatus = (typeof announcementStatuses)[number];

export const announcementVariants = ['info', 'event', 'promo', 'urgent'] as const;
export type AnnouncementVariant = (typeof announcementVariants)[number];

export const reservationIntentTypes = ['standard', 'event', 'special_evening', 'vip'] as const;
export type ReservationIntentType = (typeof reservationIntentTypes)[number];

export const glimpseMediaTypes = ['image', 'video'] as const;
export type GlimpseMediaType = (typeof glimpseMediaTypes)[number];

export const glimpseTextAlignments = ['left', 'center', 'right'] as const;
export type GlimpseTextAlignment = (typeof glimpseTextAlignments)[number];

export const eventCategories = ['music', 'sunset', 'brunch', 'cocktail', 'special', 'private'] as const;
export type EventCategory = (typeof eventCategories)[number];

export const eventReservationModes = ['optional', 'required', 'external', 'none'] as const;
export type EventReservationMode = (typeof eventReservationModes)[number];

export const menuLabels = ['signature', 'popular', 'new', 'seasonal'] as const;
export type MenuLabel = (typeof menuLabels)[number];

export const menuCategories = [
  'signature_cocktails',
  'spritz',
  'vodka',
  'cognac',
  'whisky',
  'rum',
  'tequila_mezcal',
  'gin',
  'liqueurs',
  'wine',
  'beer',
  'cider',
  'premium_mixers',
  'water',
  'soft_drinks',
  'fresh_juices',
  'hot_beverages',
  'cigars',
] as const;
export type MenuCategory = (typeof menuCategories)[number];

export const mediaAssetStatuses = ['draft', 'ready', 'archived'] as const;
export type MediaAssetStatus = (typeof mediaAssetStatuses)[number];

export const mediaAssetTypes = ['image', 'video'] as const;
export type MediaAssetType = (typeof mediaAssetTypes)[number];

export const mediaCollectionSlugs = ['interijer', 'terasa', 'kava', 'kokteli', 'zalazak', 'dogadanja', 'hrana'] as const;
export type MediaCollectionSlug = (typeof mediaCollectionSlugs)[number];

export const contentScopes = ['home', 'about', 'contact', 'settings', 'seo'] as const;
export type ContentScope = (typeof contentScopes)[number];

export interface LocalizedText {
  hr: string;
  en: string;
}

export interface MenuItemDTO {
  id: number;
  category: MenuCategory;
  signature: boolean;
  priceLabel: string;
  sortOrder: number;
  secondaryPriceLabel: string | null;
  availability: boolean;
  featured: boolean;
  labels: MenuLabel[];
  allergens: string[];
  mediaUrl: string | null;
  bookSection: string | null;
  spreadStyle: string | null;
  localizations: Record<LocaleCode, { name: string; description: string }>;
}

export interface EventDTO {
  id: number;
  slug: string;
  status: EventStatus;
  featured: boolean;
  capacity: number;
  registrationsCount: number;
  waitlistEnabled: boolean;
  soldOut: boolean;
  startsAt: string;
  endsAt: string | null;
  imageUrl: string | null;
  posterMediaId: number | null;
  category: EventCategory;
  timezone: string;
  reservationMode: EventReservationMode;
  priceLabel: string | null;
  ticketUrl: string | null;
  linkedAnnouncementId: number | null;
  linkedGlimpseGroupId: number | null;
  tags: string[];
  gallery: MediaAssetDTO[];
  localizations: Record<LocaleCode, { title: string; teaser: string; description: string }>;
}

export interface ReservationDTO {
  id: number;
  status: ReservationStatus;
  customerName: string;
  email: string;
  phone: string;
  guests: number;
  area: ReservationArea;
  reservationDate: string;
  reservationTime: string;
  timezone: string;
  notes: string | null;
  adminNotes: string | null;
  source: string;
  intentType: ReservationIntentType;
  eventId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentEntryDTO {
  id: number;
  scope: ContentScope;
  contentKey: string;
  locale: LocaleCode;
  value: string;
  updatedAt: string;
}

export interface FaqEntryDTO {
  id: number;
  active: boolean;
  category: string;
  sortOrder: number;
  localizations: Record<LocaleCode, { question: string; answer: string }>;
}

export interface SiteSettingsDTO {
  businessName: string;
  timezone: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  address: string;
  city: string;
}

export interface AnnouncementDTO {
  id: number;
  status: AnnouncementStatus;
  variant: AnnouncementVariant;
  priority: number;
  sortOrder: number;
  dismissible: boolean;
  persistentDismissalKey: string | null;
  ctaUrl: string | null;
  eventId: number | null;
  reservationIntent: ReservationIntentType | null;
  startsAt: string | null;
  endsAt: string | null;
  localizations: Record<LocaleCode, { title: string; body: string; ctaLabel: string }>;
}

export interface MediaAssetDTO {
  id: number;
  filename: string;
  originalFilename: string;
  mimeType: string;
  mediaType: MediaAssetType;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
  status: MediaAssetStatus;
  featured: boolean;
  tags: string[];
  collections: string[];
  focalPointX: number | null;
  focalPointY: number | null;
  localizations: Record<LocaleCode, { alt: string; caption: string }>;
}

export interface GlimpseSlideDTO {
  id: number;
  groupId: number;
  mediaType: GlimpseMediaType;
  mediaAssetId: number | null;
  mediaUrl: string | null;
  durationMs: number;
  overlayIntensity: number;
  textAlignment: GlimpseTextAlignment;
  sortOrder: number;
  ctaUrl: string | null;
  localizations: Record<LocaleCode, { headline: string; body: string; ctaLabel: string }>;
}

export interface GlimpseGroupDTO {
  id: number;
  active: boolean;
  sortOrder: number;
  coverMediaId: number | null;
  coverImageUrl: string | null;
  localizations: Record<LocaleCode, { label: string; title: string }>;
  slides: GlimpseSlideDTO[];
}

export interface GalleryCollectionDTO {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  items: MediaAssetDTO[];
}

export interface HomepageModuleDTO {
  id: number;
  moduleKey: string;
  enabled: boolean;
  sortOrder: number;
  settings: Record<string, unknown>;
}

export interface BootstrapPayload {
  locale: LocaleCode;
  fallbackLocale: LocaleCode;
  generatedAt: string;
  settings: SiteSettingsDTO;
  menu: MenuItemDTO[];
  featuredEvents: EventDTO[];
  announcements: AnnouncementDTO[];
  glimpses: GlimpseGroupDTO[];
  mediaCollections: GalleryCollectionDTO[];
}

export interface AdminSessionDTO {
  authenticated: boolean;
  csrfToken: string | null;
  user: null | {
    id: number;
    email: string;
    role: string;
    displayName: string;
  };
}

export interface AdminLoginChallengeDTO {
  mode: 'builtin';
  challengeId: string;
  prompt: string;
  expiresAt: string;
  requiresTwoFactor: boolean;
}

export interface AdminTwoFactorSetupDTO {
  issuer: string;
  accountLabel: string;
  secret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
  alreadyEnabled: boolean;
}

export interface ContactSubmissionResultDTO {
  submitted: true;
}

export interface SocialFeedItemDTO {
  id: string;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel_album';
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
}

export interface SocialFeedDTO {
  instagramProfileUrl: string;
  instagramUsername: string;
  facebookPageUrl: string;
  items: SocialFeedItemDTO[];
  available: boolean;
  source: 'instagram_graph' | 'fallback';
  lastUpdated: string | null;
  fallbackReason: string | null;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  details?: Record<string, unknown>;
}
