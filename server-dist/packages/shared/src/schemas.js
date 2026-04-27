"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.specialScheduleSchema = exports.homepageModuleUpsertSchema = exports.mediaAssetUpsertSchema = exports.glimpseSlideUpsertSchema = exports.glimpseGroupUpsertSchema = exports.announcementUpsertSchema = exports.faqUpsertSchema = exports.businessSettingsSchema = exports.contentEntryUpsertSchema = exports.menuItemUpsertSchema = exports.eventUpsertSchema = exports.contactSubmissionSchema = exports.eventRegistrationSchema = exports.reservationStatusUpdateSchema = exports.reservationSubmissionSchema = exports.localizedOptionalStringMapSchema = exports.localizedStringMapSchema = exports.adminLoginSchema = exports.localeSchema = void 0;
const zod_1 = require("zod");
const domain_1 = require("./domain");
exports.localeSchema = zod_1.z.enum(domain_1.locales);
const internalOrExternalUrlSchema = zod_1.z.union([
    zod_1.z.string().trim().url(),
    zod_1.z
        .string()
        .trim()
        .regex(/^\/[^\s]*$/),
]);
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email().max(190),
    password: zod_1.z.string().min(1).max(128),
    deviceId: zod_1.z.string().trim().min(8).max(128),
    challengeId: zod_1.z.string().trim().uuid(),
    challengeAnswer: zod_1.z.string().trim().min(2).max(64),
    oneTimeCode: zod_1.z.preprocess((value) => {
        if (typeof value !== 'string')
            return value;
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
    }, zod_1.z.string().regex(/^\d{6}$/).optional()),
});
exports.localizedStringMapSchema = zod_1.z.object({
    hr: zod_1.z.string().min(1).max(5000),
    en: zod_1.z.string().min(1).max(5000),
});
exports.localizedOptionalStringMapSchema = zod_1.z.object({
    hr: zod_1.z.string().trim().max(5000).default(''),
    en: zod_1.z.string().trim().max(5000).default(''),
});
exports.reservationSubmissionSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().trim().email().max(190),
    phone: zod_1.z.string().trim().min(6).max(40),
    guests: zod_1.z.number().int().min(1).max(12),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    area: zod_1.z.enum(domain_1.reservationAreas),
    notes: zod_1.z.string().trim().max(1000).optional().default(''),
    consent: zod_1.z.literal(true),
    locale: exports.localeSchema.default('hr'),
    idempotencyKey: zod_1.z.string().trim().min(8).max(128),
    honeypot: zod_1.z.string().trim().max(0).optional().default(''),
    submittedAt: zod_1.z.string().datetime(),
    intentType: zod_1.z.enum(domain_1.reservationIntentTypes).default('standard'),
    eventId: zod_1.z.number().int().positive().nullable().optional().default(null),
});
exports.reservationStatusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(domain_1.reservationStatuses),
    adminNotes: zod_1.z.string().trim().max(1000).optional(),
});
exports.eventRegistrationSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().trim().email().max(190),
    phone: zod_1.z.string().trim().min(6).max(40),
    locale: exports.localeSchema.default('hr'),
});
exports.contactSubmissionSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().trim().email().max(190),
    message: zod_1.z.string().trim().min(10).max(2000),
    locale: exports.localeSchema.default('hr'),
    honeypot: zod_1.z.string().trim().max(0).optional().default(''),
});
exports.eventUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    slug: zod_1.z
        .string()
        .trim()
        .min(3)
        .max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    status: zod_1.z.enum(domain_1.eventStatuses),
    featured: zod_1.z.boolean().default(false),
    capacity: zod_1.z.number().int().min(1).max(500),
    waitlistEnabled: zod_1.z.boolean().default(true),
    startsAt: zod_1.z.string().datetime(),
    endsAt: zod_1.z.string().datetime().nullable(),
    imageUrl: zod_1.z.string().trim().max(255).nullable(),
    posterMediaId: zod_1.z.number().int().positive().nullable().default(null),
    category: zod_1.z.enum(domain_1.eventCategories).default('special'),
    timezone: zod_1.z.string().trim().min(2).max(80).default('Europe/Zagreb'),
    reservationMode: zod_1.z.enum(domain_1.eventReservationModes).default('optional'),
    priceLabel: zod_1.z.string().trim().max(40).nullable().default(null),
    ticketUrl: internalOrExternalUrlSchema.nullable().default(null),
    linkedAnnouncementId: zod_1.z.number().int().positive().nullable().default(null),
    linkedGlimpseGroupId: zod_1.z.number().int().positive().nullable().default(null),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1).max(40)).default([]),
    galleryMediaIds: zod_1.z.array(zod_1.z.number().int().positive()).default([]),
    localizations: zod_1.z.object({
        hr: zod_1.z.object({
            title: zod_1.z.string().trim().min(2).max(140),
            teaser: zod_1.z.string().trim().min(10).max(280),
            description: zod_1.z.string().trim().min(10).max(3000),
        }),
        en: zod_1.z.object({
            title: zod_1.z.string().trim().min(2).max(140),
            teaser: zod_1.z.string().trim().min(10).max(280),
            description: zod_1.z.string().trim().min(10).max(3000),
        }),
    }),
});
exports.menuItemUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    category: zod_1.z.enum(domain_1.menuCategories),
    signature: zod_1.z.boolean().default(false),
    priceLabel: zod_1.z.string().trim().min(1).max(20),
    secondaryPriceLabel: zod_1.z.string().trim().max(20).nullable().default(null),
    sortOrder: zod_1.z.number().int().min(0).max(999),
    availability: zod_1.z.boolean().default(true),
    featured: zod_1.z.boolean().default(false),
    labels: zod_1.z.array(zod_1.z.enum(domain_1.menuLabels)).default([]),
    allergens: zod_1.z.array(zod_1.z.string().trim().min(1).max(60)).default([]),
    mediaAssetId: zod_1.z.number().int().positive().nullable().default(null),
    bookSection: zod_1.z.string().trim().max(80).nullable().default(null),
    spreadStyle: zod_1.z.string().trim().max(40).nullable().default(null),
    localizations: zod_1.z.object({
        hr: zod_1.z.object({
            name: zod_1.z.string().trim().min(2).max(140),
            description: zod_1.z.string().trim().max(500).default(''),
        }),
        en: zod_1.z.object({
            name: zod_1.z.string().trim().min(2).max(140),
            description: zod_1.z.string().trim().max(500).default(''),
        }),
    }),
});
exports.contentEntryUpsertSchema = zod_1.z.object({
    scope: zod_1.z.enum(domain_1.contentScopes),
    contentKey: zod_1.z.string().trim().min(2).max(120),
    locale: exports.localeSchema,
    value: zod_1.z.string().trim().min(1).max(8000),
});
exports.businessSettingsSchema = zod_1.z.object({
    businessName: zod_1.z.string().trim().min(2).max(120),
    timezone: zod_1.z.string().trim().min(2).max(80),
    phone: zod_1.z.string().trim().min(6).max(40),
    whatsappPhone: zod_1.z.string().trim().min(6).max(40),
    email: zod_1.z.string().trim().email(),
    address: zod_1.z.string().trim().min(3).max(200),
    city: zod_1.z.string().trim().min(2).max(120),
});
exports.faqUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    active: zod_1.z.boolean().default(true),
    category: zod_1.z.string().trim().min(2).max(40),
    sortOrder: zod_1.z.number().int().min(0).max(999).default(0),
    localizations: zod_1.z.object({
        hr: zod_1.z.object({
            question: zod_1.z.string().trim().min(3).max(180),
            answer: zod_1.z.string().trim().min(10).max(4000),
        }),
        en: zod_1.z.object({
            question: zod_1.z.string().trim().min(3).max(180),
            answer: zod_1.z.string().trim().min(10).max(4000),
        }),
    }),
});
exports.announcementUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.enum(domain_1.announcementStatuses),
    variant: zod_1.z.enum(domain_1.announcementVariants).default('info'),
    priority: zod_1.z.number().int().min(0).max(999).default(100),
    sortOrder: zod_1.z.number().int().min(0).max(999).default(0),
    dismissible: zod_1.z.boolean().default(false),
    persistentDismissalKey: zod_1.z.string().trim().max(120).nullable().default(null),
    ctaUrl: internalOrExternalUrlSchema.nullable().default(null),
    eventId: zod_1.z.number().int().positive().nullable().default(null),
    reservationIntent: zod_1.z.enum(domain_1.reservationIntentTypes).nullable().default(null),
    startsAt: zod_1.z.string().datetime().nullable().default(null),
    endsAt: zod_1.z.string().datetime().nullable().default(null),
    localizations: zod_1.z.object({
        hr: zod_1.z.object({
            title: zod_1.z.string().trim().min(2).max(160),
            body: zod_1.z.string().trim().min(2).max(320),
            ctaLabel: zod_1.z.string().trim().max(40).default(''),
        }),
        en: zod_1.z.object({
            title: zod_1.z.string().trim().min(2).max(160),
            body: zod_1.z.string().trim().min(2).max(320),
            ctaLabel: zod_1.z.string().trim().max(40).default(''),
        }),
    }),
});
exports.glimpseGroupUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    active: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().min(0).max(999).default(0),
    coverMediaId: zod_1.z.number().int().positive().nullable().default(null),
    localizations: zod_1.z.object({
        hr: zod_1.z.object({
            label: zod_1.z.string().trim().min(2).max(60),
            title: zod_1.z.string().trim().min(2).max(120),
        }),
        en: zod_1.z.object({
            label: zod_1.z.string().trim().min(2).max(60),
            title: zod_1.z.string().trim().min(2).max(120),
        }),
    }),
});
exports.glimpseSlideUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    groupId: zod_1.z.number().int().positive(),
    mediaType: zod_1.z.enum(domain_1.glimpseMediaTypes),
    mediaAssetId: zod_1.z.number().int().positive().nullable().default(null),
    durationMs: zod_1.z.number().int().min(1500).max(20000).default(5000),
    overlayIntensity: zod_1.z.number().min(0).max(1).default(0.45),
    textAlignment: zod_1.z.enum(domain_1.glimpseTextAlignments).default('left'),
    sortOrder: zod_1.z.number().int().min(0).max(999).default(0),
    ctaUrl: internalOrExternalUrlSchema.nullable().default(null),
    localizations: zod_1.z.object({
        hr: zod_1.z.object({
            headline: zod_1.z.string().trim().min(2).max(120),
            body: zod_1.z.string().trim().max(300).default(''),
            ctaLabel: zod_1.z.string().trim().max(40).default(''),
        }),
        en: zod_1.z.object({
            headline: zod_1.z.string().trim().min(2).max(120),
            body: zod_1.z.string().trim().max(300).default(''),
            ctaLabel: zod_1.z.string().trim().max(40).default(''),
        }),
    }),
});
exports.mediaAssetUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.enum(domain_1.mediaAssetStatuses).default('ready'),
    featured: zod_1.z.boolean().default(false),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1).max(40)).default([]),
    collections: zod_1.z.array(zod_1.z.enum(domain_1.mediaCollectionSlugs)).default([]),
    focalPointX: zod_1.z.number().min(0).max(1).nullable().default(null),
    focalPointY: zod_1.z.number().min(0).max(1).nullable().default(null),
    localizations: zod_1.z.object({
        hr: zod_1.z.object({
            alt: zod_1.z.string().trim().min(2).max(160),
            caption: zod_1.z.string().trim().max(240).default(''),
        }),
        en: zod_1.z.object({
            alt: zod_1.z.string().trim().min(2).max(160),
            caption: zod_1.z.string().trim().max(240).default(''),
        }),
    }),
});
exports.homepageModuleUpsertSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    moduleKey: zod_1.z.string().trim().min(2).max(80),
    enabled: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().min(0).max(999).default(0),
    settings: zod_1.z.record(zod_1.z.any()).default({}),
});
exports.specialScheduleSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    opensAt: zod_1.z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    closesAt: zod_1.z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    closed: zod_1.z.boolean(),
    reason: zod_1.z.string().trim().max(255).default(''),
});
