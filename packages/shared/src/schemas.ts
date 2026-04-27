import { z } from 'zod';
import {
  announcementStatuses,
  announcementVariants,
  contentScopes,
  eventCategories,
  eventReservationModes,
  eventStatuses,
  glimpseMediaTypes,
  glimpseTextAlignments,
  locales,
  mediaAssetStatuses,
  mediaCollectionSlugs,
  menuCategories,
  menuLabels,
  reservationIntentTypes,
  reservationAreas,
  reservationStatuses,
} from './domain';

export const localeSchema = z.enum(locales);
const internalOrExternalUrlSchema = z.union([
  z.string().trim().url(),
  z
    .string()
    .trim()
    .regex(/^\/[^\s]*$/),
]);

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(190),
  password: z.string().min(1).max(128),
  deviceId: z.string().trim().min(8).max(128),
  challengeId: z.string().trim().uuid(),
  challengeAnswer: z.string().trim().min(2).max(64),
  oneTimeCode: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, z.string().regex(/^\d{6}$/).optional()),
});

export const localizedStringMapSchema = z.object({
  hr: z.string().min(1).max(5000),
  en: z.string().min(1).max(5000),
});

export const localizedOptionalStringMapSchema = z.object({
  hr: z.string().trim().max(5000).default(''),
  en: z.string().trim().max(5000).default(''),
});

export const reservationSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  phone: z.string().trim().min(6).max(40),
  guests: z.number().int().min(1).max(12),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  area: z.enum(reservationAreas),
  notes: z.string().trim().max(1000).optional().default(''),
  consent: z.literal(true),
  locale: localeSchema.default('hr'),
  idempotencyKey: z.string().trim().min(8).max(128),
  honeypot: z.string().trim().max(0).optional().default(''),
  submittedAt: z.string().datetime(),
  intentType: z.enum(reservationIntentTypes).default('standard'),
  eventId: z.number().int().positive().nullable().optional().default(null),
});

export const reservationStatusUpdateSchema = z.object({
  status: z.enum(reservationStatuses),
  adminNotes: z.string().trim().max(1000).optional(),
});

export const eventRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  phone: z.string().trim().min(6).max(40),
  locale: localeSchema.default('hr'),
});

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  message: z.string().trim().min(10).max(2000),
  locale: localeSchema.default('hr'),
  honeypot: z.string().trim().max(0).optional().default(''),
});

export const eventUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(eventStatuses),
  featured: z.boolean().default(false),
  capacity: z.number().int().min(1).max(500),
  waitlistEnabled: z.boolean().default(true),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable(),
  imageUrl: z.string().trim().max(255).nullable(),
  posterMediaId: z.number().int().positive().nullable().default(null),
  category: z.enum(eventCategories).default('special'),
  timezone: z.string().trim().min(2).max(80).default('Europe/Zagreb'),
  reservationMode: z.enum(eventReservationModes).default('optional'),
  priceLabel: z.string().trim().max(40).nullable().default(null),
  ticketUrl: internalOrExternalUrlSchema.nullable().default(null),
  linkedAnnouncementId: z.number().int().positive().nullable().default(null),
  linkedGlimpseGroupId: z.number().int().positive().nullable().default(null),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  galleryMediaIds: z.array(z.number().int().positive()).default([]),
  localizations: z.object({
    hr: z.object({
      title: z.string().trim().min(2).max(140),
      teaser: z.string().trim().min(10).max(280),
      description: z.string().trim().min(10).max(3000),
    }),
    en: z.object({
      title: z.string().trim().min(2).max(140),
      teaser: z.string().trim().min(10).max(280),
      description: z.string().trim().min(10).max(3000),
    }),
  }),
});

export const menuItemUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  category: z.enum(menuCategories),
  signature: z.boolean().default(false),
  priceLabel: z.string().trim().min(1).max(20),
  secondaryPriceLabel: z.string().trim().max(20).nullable().default(null),
  sortOrder: z.number().int().min(0).max(999),
  availability: z.boolean().default(true),
  featured: z.boolean().default(false),
  labels: z.array(z.enum(menuLabels)).default([]),
  allergens: z.array(z.string().trim().min(1).max(60)).default([]),
  mediaAssetId: z.number().int().positive().nullable().default(null),
  bookSection: z.string().trim().max(80).nullable().default(null),
  spreadStyle: z.string().trim().max(40).nullable().default(null),
  localizations: z.object({
    hr: z.object({
      name: z.string().trim().min(2).max(140),
      description: z.string().trim().max(500).default(''),
    }),
    en: z.object({
      name: z.string().trim().min(2).max(140),
      description: z.string().trim().max(500).default(''),
    }),
  }),
});

export const contentEntryUpsertSchema = z.object({
  scope: z.enum(contentScopes),
  contentKey: z.string().trim().min(2).max(120),
  locale: localeSchema,
  value: z.string().trim().min(1).max(8000),
});

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(40),
  whatsappPhone: z.string().trim().min(6).max(40),
  email: z.string().trim().email(),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(120),
});

export const faqUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  active: z.boolean().default(true),
  category: z.string().trim().min(2).max(40),
  sortOrder: z.number().int().min(0).max(999).default(0),
  localizations: z.object({
    hr: z.object({
      question: z.string().trim().min(3).max(180),
      answer: z.string().trim().min(10).max(4000),
    }),
    en: z.object({
      question: z.string().trim().min(3).max(180),
      answer: z.string().trim().min(10).max(4000),
    }),
  }),
});

export const announcementUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  status: z.enum(announcementStatuses),
  variant: z.enum(announcementVariants).default('info'),
  priority: z.number().int().min(0).max(999).default(100),
  sortOrder: z.number().int().min(0).max(999).default(0),
  dismissible: z.boolean().default(false),
  persistentDismissalKey: z.string().trim().max(120).nullable().default(null),
  ctaUrl: internalOrExternalUrlSchema.nullable().default(null),
  eventId: z.number().int().positive().nullable().default(null),
  reservationIntent: z.enum(reservationIntentTypes).nullable().default(null),
  startsAt: z.string().datetime().nullable().default(null),
  endsAt: z.string().datetime().nullable().default(null),
  localizations: z.object({
    hr: z.object({
      title: z.string().trim().min(2).max(160),
      body: z.string().trim().min(2).max(320),
      ctaLabel: z.string().trim().max(40).default(''),
    }),
    en: z.object({
      title: z.string().trim().min(2).max(160),
      body: z.string().trim().min(2).max(320),
      ctaLabel: z.string().trim().max(40).default(''),
    }),
  }),
});

export const glimpseGroupUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
  coverMediaId: z.number().int().positive().nullable().default(null),
  localizations: z.object({
    hr: z.object({
      label: z.string().trim().min(2).max(60),
      title: z.string().trim().min(2).max(120),
    }),
    en: z.object({
      label: z.string().trim().min(2).max(60),
      title: z.string().trim().min(2).max(120),
    }),
  }),
});

export const glimpseSlideUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  groupId: z.number().int().positive(),
  mediaType: z.enum(glimpseMediaTypes),
  mediaAssetId: z.number().int().positive().nullable().default(null),
  durationMs: z.number().int().min(1500).max(20000).default(5000),
  overlayIntensity: z.number().min(0).max(1).default(0.45),
  textAlignment: z.enum(glimpseTextAlignments).default('left'),
  sortOrder: z.number().int().min(0).max(999).default(0),
  ctaUrl: internalOrExternalUrlSchema.nullable().default(null),
  localizations: z.object({
    hr: z.object({
      headline: z.string().trim().min(2).max(120),
      body: z.string().trim().max(300).default(''),
      ctaLabel: z.string().trim().max(40).default(''),
    }),
    en: z.object({
      headline: z.string().trim().min(2).max(120),
      body: z.string().trim().max(300).default(''),
      ctaLabel: z.string().trim().max(40).default(''),
    }),
  }),
});

export const mediaAssetUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  status: z.enum(mediaAssetStatuses).default('ready'),
  featured: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  collections: z.array(z.enum(mediaCollectionSlugs)).default([]),
  focalPointX: z.number().min(0).max(1).nullable().default(null),
  focalPointY: z.number().min(0).max(1).nullable().default(null),
  localizations: z.object({
    hr: z.object({
      alt: z.string().trim().min(2).max(160),
      caption: z.string().trim().max(240).default(''),
    }),
    en: z.object({
      alt: z.string().trim().min(2).max(160),
      caption: z.string().trim().max(240).default(''),
    }),
  }),
});

export const homepageModuleUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  moduleKey: z.string().trim().min(2).max(80),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
  settings: z.record(z.any()).default({}),
});

export const specialScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  closed: z.boolean(),
  reason: z.string().trim().max(255).default(''),
});

export type ReservationSubmissionInput = z.infer<typeof reservationSubmissionSchema>;
export type ReservationStatusUpdateInput = z.infer<typeof reservationStatusUpdateSchema>;
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;
export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type EventUpsertInput = z.infer<typeof eventUpsertSchema>;
export type MenuItemUpsertInput = z.infer<typeof menuItemUpsertSchema>;
export type ContentEntryUpsertInput = z.infer<typeof contentEntryUpsertSchema>;
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type FaqUpsertInput = z.infer<typeof faqUpsertSchema>;
export type AnnouncementUpsertInput = z.infer<typeof announcementUpsertSchema>;
export type GlimpseGroupUpsertInput = z.infer<typeof glimpseGroupUpsertSchema>;
export type GlimpseSlideUpsertInput = z.infer<typeof glimpseSlideUpsertSchema>;
export type MediaAssetUpsertInput = z.infer<typeof mediaAssetUpsertSchema>;
export type HomepageModuleUpsertInput = z.infer<typeof homepageModuleUpsertSchema>;
