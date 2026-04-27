import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { Router } from 'express';
import {
  adminLoginSchema,
  announcementUpsertSchema,
  businessSettingsSchema,
  eventUpsertSchema,
  faqUpsertSchema,
  glimpseGroupUpsertSchema,
  glimpseSlideUpsertSchema,
  mediaAssetUpsertSchema,
  menuItemUpsertSchema,
  reservationStatusUpdateSchema,
  type SiteSettingsDTO,
} from '../../../../packages/shared/src';
import { env, isProduction } from '../config';
import { requireAdmin } from '../middleware/auth';
import { adminMutationLimiter, loginLimiter } from '../middleware/rate-limit';
import { verifyAdminTwoFactorCode } from '../services/admin-2fa-service';
import { createAdminTwoFactorSetup } from '../services/admin-2fa-setup-service';
import { createAdminLoginChallenge, verifyAdminLoginChallenge } from '../services/admin-login-challenge-service';
import { assertLoginAllowed, recordLoginFailure } from '../services/admin-login-security-service';
import { authenticateAdmin, createSession, invalidateSession } from '../services/auth-service';
import { writeAuditLog } from '../services/audit-service';
import { deleteAnnouncement, listActiveAnnouncements, listAnnouncements, upsertAnnouncement } from '../services/announcement-service';
import {
  listMenuItems,
  listMenuItemsPaginated,
  updateBusinessSettings,
  upsertMenuItem,
} from '../services/content-service';
import { listAllEvents, listAllEventsPaginated, upsertEvent } from '../services/event-service';
import { deleteFaqEntry, listFaqEntries, listFaqEntriesPaginated, upsertFaqEntry } from '../services/faq-service';
import { listGlimpseGroups, upsertGlimpseGroup, upsertGlimpseSlide } from '../services/glimpse-service';
import {
  createMediaAsset,
  deleteMediaAsset,
  ensureMediaDirectory,
  listGalleryCollections,
  listMediaAssets,
  listMediaAssetsPaginated,
  upsertMediaAssetMetadata,
} from '../services/media-service';
import { listReservations, listReservationsPaginated, updateReservationStatus } from '../services/reservation-service';
import { parseAdminListQuery } from '../utils/admin-query';
import { AppError } from '../utils/errors';

ensureMediaDirectory();

const allowedUploadMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const allowedUploadExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.webm']);

const uploadSignatureValidators: Array<{
  mimeTypes: string[];
  extensions: string[];
  matches: (buffer: Buffer) => boolean;
}> = [
  {
    mimeTypes: ['image/jpeg'],
    extensions: ['.jpg', '.jpeg'],
    matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    mimeTypes: ['image/png'],
    extensions: ['.png'],
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
  {
    mimeTypes: ['image/gif'],
    extensions: ['.gif'],
    matches: (buffer) => ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')),
  },
  {
    mimeTypes: ['image/webp'],
    extensions: ['.webp'],
    matches: (buffer) => buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mimeTypes: ['video/mp4', 'video/quicktime'],
    extensions: ['.mp4', '.mov'],
    matches: (buffer) => buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp',
  },
  {
    mimeTypes: ['video/webm'],
    extensions: ['.webm'],
    matches: (buffer) => buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3,
  },
];

const removeUploadedFiles = (files: Express.Multer.File[] | undefined) => {
  files?.forEach((file) => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

const assertUploadSafety = (file: Express.Multer.File) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedUploadExtensions.has(extension)) {
    throw new AppError(400, 'MEDIA_EXTENSION_NOT_ALLOWED', 'File extension is not allowed');
  }

  if (!allowedUploadMimeTypes.has(file.mimetype)) {
    throw new AppError(400, 'MEDIA_TYPE_NOT_ALLOWED', 'File type is not allowed');
  }

  const signature = fs.readFileSync(file.path).subarray(0, 64);
  const validator = uploadSignatureValidators.find(
    (entry) => entry.mimeTypes.includes(file.mimetype) && entry.extensions.includes(extension)
  );

  if (!validator || !validator.matches(signature)) {
    throw new AppError(400, 'MEDIA_SIGNATURE_INVALID', 'Uploaded file failed content validation');
  }
};

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, env.MEDIA_UPLOAD_DIR),
  filename: (_request, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    callback(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MEDIA_MAX_FILE_SIZE_MB * 1024 * 1024, files: 8 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const hasSafeCharacters = /^[a-zA-Z0-9._ -]+$/.test(file.originalname);

    if (!hasSafeCharacters || file.originalname.includes('..')) {
      callback(new AppError(400, 'MEDIA_FILENAME_INVALID', 'Filename contains unsupported characters'));
      return;
    }

    if (!allowedUploadMimeTypes.has(file.mimetype) || !allowedUploadExtensions.has(extension)) {
      callback(new AppError(400, 'MEDIA_TYPE_NOT_ALLOWED', 'Only vetted image and video uploads are supported'));
      return;
    }
    callback(null, true);
  },
});

const parseJsonField = <T>(value: unknown): T => {
  if (typeof value !== 'string') return value as T;
  return JSON.parse(value) as T;
};

const normalizeDeviceId = (value: unknown) => {
  if (typeof value !== 'string') return crypto.randomUUID();
  const trimmed = value.trim();
  return trimmed.length >= 8 && trimmed.length <= 128 ? trimmed : crypto.randomUUID();
};

export const adminRouter = Router();

adminRouter.get('/api/admin/auth/challenge', (request, response) => {
  response.json({
    ok: true,
    data: createAdminLoginChallenge(request.ip, request.header('user-agent')),
  });
});

adminRouter.post('/api/admin/login', loginLimiter, (request, response, next) => {
  const deviceId = normalizeDeviceId(request.header('x-admin-device-id') ?? request.body?.deviceId);

  try {
    const payload = adminLoginSchema.parse({
      ...request.body,
      deviceId,
    });
    assertLoginAllowed({ email: payload.email, ipAddress: request.ip, deviceId });
    verifyAdminLoginChallenge({
      challengeId: payload.challengeId,
      answer: payload.challengeAnswer,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    verifyAdminTwoFactorCode(payload.oneTimeCode);
    const admin = authenticateAdmin({
      email: payload.email,
      password: payload.password,
      ipAddress: request.ip,
      deviceId,
    });
    const session = createSession(admin.id, request.ip, request.header('user-agent'));

    response.cookie(env.SESSION_COOKIE_NAME, session.sessionId, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
      path: '/',
    });

    writeAuditLog({
      adminId: admin.id,
      action: 'admin.login',
      entityType: 'session',
      entityId: session.sessionId,
      requestId: request.requestId,
    });

    response.json({
      ok: true,
      data: {
        authenticated: true,
        csrfToken: session.csrfToken,
        user: admin,
      },
    });
  } catch (error) {
    const loginEmail = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : null;
    const errorCode =
      error instanceof Error ? ('code' in error ? String((error as { code?: string }).code ?? 'UNKNOWN') : error.name) : 'UNKNOWN';

    if (loginEmail && ['ADMIN_2FA_REQUIRED', 'ADMIN_2FA_INVALID'].includes(errorCode)) {
      recordLoginFailure({ email: loginEmail, ipAddress: request.ip, deviceId });
    }

    writeAuditLog({
      action: 'admin.login.failed',
      entityType: 'session',
      entityId: null,
      details: {
        email: loginEmail,
        ipAddress: request.ip,
        userAgent: request.header('user-agent') ?? null,
        code: errorCode,
      },
      requestId: request.requestId,
    });
    next(error);
  }
});

adminRouter.post('/api/admin/logout', requireAdmin, (request, response) => {
  const sessionId = request.cookies?.[env.SESSION_COOKIE_NAME];
  if (sessionId) invalidateSession(sessionId);
  response.clearCookie(env.SESSION_COOKIE_NAME, { path: '/', sameSite: 'strict', secure: isProduction });
  response.json({ ok: true, data: { loggedOut: true } });
});

adminRouter.get('/api/admin/dashboard', requireAdmin, (_request, response) => {
  response.json({
    ok: true,
    data: {
      reservations: listReservations().slice(0, 5),
      events: listAllEvents().slice(0, 5),
      announcements: listActiveAnnouncements(),
      mediaCount: listMediaAssets().length,
      faqCount: listFaqEntries(false).length,
    },
  });
});

adminRouter.get('/api/admin/security/2fa/setup', requireAdmin, async (_request, response, next) => {
  try {
    response.json({
      ok: true,
      data: await createAdminTwoFactorSetup(),
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/api/admin/reservations', requireAdmin, (request, response) => {
  response.json({ ok: true, data: listReservationsPaginated(parseAdminListQuery(request.query)) });
});

adminRouter.patch('/api/admin/reservations/:id/status', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = reservationStatusUpdateSchema.parse(request.body);
    const reservation = updateReservationStatus(Number(request.params.id), payload.status, request.adminSession?.user?.id, payload.adminNotes);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'reservation.status.updated',
      entityType: 'reservation',
      entityId: String(request.params.id),
      details: payload,
      requestId: request.requestId,
    });
    response.json({ ok: true, data: reservation });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/api/admin/events', requireAdmin, (request, response) => {
  response.json({ ok: true, data: listAllEventsPaginated(parseAdminListQuery(request.query)) });
});

adminRouter.post('/api/admin/events', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = eventUpsertSchema.parse(request.body);
    const event = upsertEvent(payload);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'event.created',
      entityType: 'event',
      entityId: String(event.id),
      requestId: request.requestId,
    });
    response.status(201).json({ ok: true, data: event });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/api/admin/events/:id', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = eventUpsertSchema.parse(request.body);
    const event = upsertEvent(payload, Number(request.params.id));
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'event.updated',
      entityType: 'event',
      entityId: String(request.params.id),
      requestId: request.requestId,
    });
    response.json({ ok: true, data: event });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/api/admin/menu', requireAdmin, (request, response) => {
  response.json({ ok: true, data: listMenuItemsPaginated(parseAdminListQuery(request.query)) });
});

adminRouter.post('/api/admin/menu', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = menuItemUpsertSchema.parse(request.body);
    const id = upsertMenuItem(payload);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'menu_item.upserted',
      entityType: 'menu_item',
      entityId: String(id),
      requestId: request.requestId,
    });
    response.status(201).json({ ok: true, data: { id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/api/admin/settings', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = businessSettingsSchema.parse(request.body);
    const settingsPayload: SiteSettingsDTO = {
      businessName: payload.businessName,
      timezone: payload.timezone,
      phone: payload.phone,
      whatsappPhone: payload.whatsappPhone,
      email: payload.email,
      address: payload.address,
      city: payload.city,
    };
    updateBusinessSettings(settingsPayload);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'business_settings.updated',
      entityType: 'business_settings',
      entityId: '1',
      requestId: request.requestId,
    });
    response.json({ ok: true, data: payload });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/api/admin/announcements', requireAdmin, (request, response) => {
  const query = parseAdminListQuery(request.query);
  const normalizedSearch = query.search.toLowerCase();
  const items = listAnnouncements().filter((announcement) =>
    (!query.status || announcement.status === query.status) &&
    (!normalizedSearch ||
      announcement.localizations.hr.title.toLowerCase().includes(normalizedSearch) ||
      announcement.localizations.en.title.toLowerCase().includes(normalizedSearch) ||
      announcement.localizations.hr.body.toLowerCase().includes(normalizedSearch) ||
      announcement.localizations.en.body.toLowerCase().includes(normalizedSearch))
  );
  response.json({
    ok: true,
    data: {
      items: items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
      total: items.length,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
});

adminRouter.post('/api/admin/announcements', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = announcementUpsertSchema.parse(request.body);
    const announcement = upsertAnnouncement(payload);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: payload.id ? 'announcement.updated' : 'announcement.created',
      entityType: 'announcement',
      entityId: String(announcement.id),
      requestId: request.requestId,
    });
    response.status(payload.id ? 200 : 201).json({ ok: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/api/admin/announcements/:id', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const result = deleteAnnouncement(Number(request.params.id));
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'announcement.deleted',
      entityType: 'announcement',
      entityId: String(request.params.id),
      requestId: request.requestId,
    });
    response.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/api/admin/glimpses', requireAdmin, (_request, response) => {
  response.json({ ok: true, data: listGlimpseGroups(false) });
});

adminRouter.post('/api/admin/glimpses/groups', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = glimpseGroupUpsertSchema.parse(request.body);
    const group = upsertGlimpseGroup(payload);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: payload.id ? 'glimpse_group.updated' : 'glimpse_group.created',
      entityType: 'glimpse_group',
      entityId: String(group.id),
      requestId: request.requestId,
    });
    response.status(payload.id ? 200 : 201).json({ ok: true, data: group });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/api/admin/glimpses/slides', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = glimpseSlideUpsertSchema.parse(request.body);
    const slide = upsertGlimpseSlide(payload);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: payload.id ? 'glimpse_slide.updated' : 'glimpse_slide.created',
      entityType: 'glimpse_slide',
      entityId: String(slide.id),
      requestId: request.requestId,
    });
    response.status(payload.id ? 200 : 201).json({ ok: true, data: slide });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/api/admin/media', requireAdmin, (request, response) => {
  response.json({ ok: true, data: { assets: listMediaAssetsPaginated(parseAdminListQuery(request.query)), collections: listGalleryCollections() } });
});

adminRouter.post('/api/admin/media/upload', requireAdmin, adminMutationLimiter, upload.array('files', 8), (request, response, next) => {
  try {
    const files = request.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      response.status(400).json({ ok: false, error: { code: 'MEDIA_REQUIRED', message: 'At least one file is required' } });
      return;
    }

    files.forEach(assertUploadSafety);
    const assets = files.map((file) => createMediaAsset(file));
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'media.uploaded',
      entityType: 'media_asset',
      entityId: String(assets[0]?.id ?? ''),
      details: { count: assets.length },
      requestId: request.requestId,
    });
    response.status(201).json({ ok: true, data: assets });
  } catch (error) {
    removeUploadedFiles(request.files as Express.Multer.File[] | undefined);
    next(error);
  }
});

adminRouter.put('/api/admin/media/:id', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = mediaAssetUpsertSchema.parse({
      ...request.body,
      tags: parseJsonField<string[]>(request.body.tags),
      collections: parseJsonField<string[]>(request.body.collections),
      localizations: parseJsonField(request.body.localizations),
    });
    const asset = upsertMediaAssetMetadata(payload, Number(request.params.id));
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'media.updated',
      entityType: 'media_asset',
      entityId: String(request.params.id),
      requestId: request.requestId,
    });
    response.json({ ok: true, data: asset });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/api/admin/media/:id', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    deleteMediaAsset(Number(request.params.id));
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'media.deleted',
      entityType: 'media_asset',
      entityId: String(request.params.id),
      requestId: request.requestId,
    });
    response.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/api/admin/faqs', requireAdmin, (request, response) => {
  response.json({ ok: true, data: listFaqEntriesPaginated(parseAdminListQuery(request.query)) });
});

adminRouter.post('/api/admin/faqs', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const payload = faqUpsertSchema.parse(request.body);
    const faq = upsertFaqEntry(payload);
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: payload.id ? 'faq.updated' : 'faq.created',
      entityType: 'faq',
      entityId: String(faq.id),
      requestId: request.requestId,
    });
    response.status(payload.id ? 200 : 201).json({ ok: true, data: faq });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/api/admin/faqs/:id', requireAdmin, adminMutationLimiter, (request, response, next) => {
  try {
    const result = deleteFaqEntry(Number(request.params.id));
    writeAuditLog({
      adminId: request.adminSession?.user?.id,
      action: 'faq.deleted',
      entityType: 'faq',
      entityId: String(request.params.id),
      requestId: request.requestId,
    });
    response.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});
