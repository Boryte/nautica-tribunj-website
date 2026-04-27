import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

describe('nautica api integration', () => {
  const testDbPath = path.resolve(process.cwd(), 'db', 'nautica.test.sqlite');
  const adminDeviceId = 'test-admin-device';

  let app: Awaited<ReturnType<typeof import('../../apps/api/src/app')['createApp']>>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = testDbPath;
    process.env.FRONTEND_ORIGIN = 'http://localhost:8080';
    process.env.ADMIN_BOOTSTRAP_EMAIL = 'admin@nautica.hr';
    process.env.ADMIN_BOOTSTRAP_PASSWORD = 'ChangeMeNow!2026';
    process.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_IP = '3';
    process.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_COMBO = '3';
    process.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_DEVICE = '4';
    process.env.ADMIN_LOGIN_MAX_ATTEMPTS_PER_EMAIL = '5';

    if (fs.existsSync(testDbPath)) {
      fs.rmSync(testDbPath);
    }

    const { runMigrations } = await import('../../apps/api/src/migrate');
    const { seedDatabase } = await import('../../apps/api/src/seed');
    const { createApp } = await import('../../apps/api/src/app');

    runMigrations();
    seedDatabase();
    app = createApp();
  });

  const solveChallenge = (prompt: string) => {
    const code = prompt.split(':').at(-1)?.trim() ?? '';
    return code.split('').reverse().join('');
  };

  const loginAdmin = async (agent: request.SuperAgentTest, overrides?: { password?: string; deviceId?: string }) => {
    const challenge = await agent.get('/api/admin/auth/challenge');
    expect(challenge.status).toBe(200);

    return agent
      .post('/api/admin/login')
      .set('x-admin-device-id', overrides?.deviceId ?? adminDeviceId)
      .send({
        email: 'admin@nautica.hr',
        password: overrides?.password ?? 'ChangeMeNow!2026',
        deviceId: overrides?.deviceId ?? adminDeviceId,
        challengeId: challenge.body.data.challengeId,
        challengeAnswer: solveChallenge(challenge.body.data.prompt),
      });
  };

  it('authenticates admin users and exposes a protected dashboard', async () => {
    const agent = request.agent(app);
    const login = await loginAdmin(agent);

    expect(login.status).toBe(200);
    expect(login.body.data.authenticated).toBe(true);

    const dashboard = await agent.get('/api/admin/dashboard');
    expect(dashboard.status).toBe(200);
    expect(Array.isArray(dashboard.body.data.events)).toBe(true);
  });

  it('normalizes legacy device identifiers instead of rejecting login validation', async () => {
    const agent = request.agent(app);
    const login = await loginAdmin(agent, { deviceId: 'legacy01' });

    expect(login.status).toBe(200);
    expect(login.body.data.authenticated).toBe(true);
  });

  it('accepts valid admin passwords shorter than the previous schema minimum', async () => {
    const { db } = await import('../../apps/api/src/db');
    db.prepare('UPDATE admins SET password_hash = ? WHERE email = ?').run(
      bcrypt.hashSync('Short123!', 12),
      'admin@nautica.hr',
    );

    const agent = request.agent(app);
    const login = await loginAdmin(agent, { password: 'Short123!' });

    expect(login.status).toBe(200);
    expect(login.body.data.authenticated).toBe(true);

    db.prepare('UPDATE admins SET password_hash = ? WHERE email = ?').run(
      bcrypt.hashSync('ChangeMeNow!2026', 12),
      'admin@nautica.hr',
    );
  });

  it('supports paginated admin collections and announcement deletion', async () => {
    const agent = request.agent(app);
    const login = await loginAdmin(agent);

    expect(login.status).toBe(200);
    const csrfToken = login.body.data.csrfToken as string;

    const announcements = await agent.get('/api/admin/announcements?page=1&pageSize=1&search=Sunset');
    expect(announcements.status).toBe(200);
    expect(Array.isArray(announcements.body.data.items)).toBe(true);
    expect(announcements.body.data.page).toBe(1);
    expect(announcements.body.data.pageSize).toBe(1);
    expect(announcements.body.data.total).toBeGreaterThan(0);

    const announcementId = announcements.body.data.items[0].id as number;
    const deletion = await agent
      .delete(`/api/admin/announcements/${announcementId}`)
      .set('x-csrf-token', csrfToken);
    expect(deletion.status).toBe(200);
    expect(deletion.body.data.deleted).toBe(true);

    const afterDeletion = await agent.get('/api/admin/announcements?page=1&pageSize=10');
    expect(afterDeletion.status).toBe(200);
    expect(afterDeletion.body.data.items.some((item: { id: number }) => item.id === announcementId)).toBe(false);

    const media = await agent.get('/api/admin/media?page=1&pageSize=2&search=zalazak');
    expect(media.status).toBe(200);
    expect(Array.isArray(media.body.data.assets.items)).toBe(true);
    expect(media.body.data.assets.pageSize).toBe(2);
    expect(Array.isArray(media.body.data.collections)).toBe(true);

    const twoFactorSetup = await agent.get('/api/admin/security/2fa/setup');
    expect(twoFactorSetup.status).toBe(200);
    expect(twoFactorSetup.body.data.secret).toMatch(/^[A-Z2-7]+$/);
    expect(twoFactorSetup.body.data.otpauthUri.startsWith('otpauth://totp/')).toBe(true);
    expect(twoFactorSetup.body.data.qrCodeDataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('accepts representative admin mutations with csrf protection enabled', async () => {
    const agent = request.agent(app);
    const login = await loginAdmin(agent);
    expect(login.status).toBe(200);

    const csrfToken = login.body.data.csrfToken as string;

    const csrfMismatch = await agent.put('/api/admin/settings').send({
      businessName: 'Should fail',
      timezone: 'Europe/Zagreb',
      phone: '+385 99 000 0000',
      whatsappPhone: '+385 99 000 0000',
      email: 'ops@nautica.hr',
      address: 'Riva 1',
      city: 'Tribunj',
    });
    expect(csrfMismatch.status).toBe(403);
    expect(csrfMismatch.body.error.code).toBe('CSRF_MISMATCH');

    const settingsUpdate = await agent
      .put('/api/admin/settings')
      .set('x-csrf-token', csrfToken)
      .send({
        businessName: 'Nautica Premium',
        timezone: 'Europe/Zagreb',
        phone: '+385 99 000 0000',
        whatsappPhone: '+385 99 000 0001',
        email: 'ops@nautica.hr',
        address: 'Donja Riva 55',
        city: 'Tribunj',
      });
    expect(settingsUpdate.status).toBe(200);
    expect(settingsUpdate.body.data.businessName).toBe('Nautica Premium');

    const adminMedia = await agent.get('/api/admin/media?page=1&pageSize=3');
    expect(adminMedia.status).toBe(200);
    const mediaAssetId = adminMedia.body.data.assets.items[0].id as number;

    const mediaUpdate = await agent
      .put(`/api/admin/media/${mediaAssetId}`)
      .set('x-csrf-token', csrfToken)
      .send({
        id: mediaAssetId,
        status: 'ready',
        featured: true,
        tags: ['premium', 'verified'],
        collections: ['interijer'],
        focalPointX: 0.4,
        focalPointY: 0.6,
        localizations: {
          hr: { alt: 'Provjerena fotografija', caption: 'Admin smoke test' },
          en: { alt: 'Verified photo', caption: 'Admin smoke test' },
        },
      });
    expect(mediaUpdate.status).toBe(200);
    expect(mediaUpdate.body.data.featured).toBe(true);

    const menuCreate = await agent
      .post('/api/admin/menu')
      .set('x-csrf-token', csrfToken)
      .send({
        category: 'hot_beverages',
        signature: false,
        priceLabel: '€3.80',
        secondaryPriceLabel: null,
        sortOrder: 901,
        availability: true,
        featured: false,
        labels: ['new'],
        allergens: ['milk'],
        mediaAssetId,
        bookSection: 'coffee',
        spreadStyle: 'single',
        localizations: {
          hr: { name: 'Test espresso', description: 'Smoke test stavka za admin spremanje.' },
          en: { name: 'Test espresso', description: 'Smoke test item for admin saves.' },
        },
      });
    expect(menuCreate.status).toBe(201);
    expect(typeof menuCreate.body.data.id).toBe('number');

    const faqCreate = await agent
      .post('/api/admin/faqs')
      .set('x-csrf-token', csrfToken)
      .send({
        active: true,
        category: 'Operations',
        sortOrder: 99,
        localizations: {
          hr: {
            question: 'Radi li admin save?',
            answer: 'Da, ovaj FAQ nastaje kroz integration smoke test i potvrđuje admin unos.',
          },
          en: {
            question: 'Does admin save work?',
            answer: 'Yes, this FAQ is created by the integration smoke test to verify admin writes.',
          },
        },
      });
    expect(faqCreate.status).toBe(201);
    expect(faqCreate.body.data.category).toBe('Operations');

    const eventCreate = await agent
      .post('/api/admin/events')
      .set('x-csrf-token', csrfToken)
      .send({
        slug: 'admin-smoke-test-event',
        status: 'draft',
        featured: false,
        capacity: 25,
        waitlistEnabled: true,
        startsAt: '2026-08-20T18:00:00.000Z',
        endsAt: '2026-08-20T22:00:00.000Z',
        imageUrl: '/site-media/events-featured.jpg',
        posterMediaId: mediaAssetId,
        category: 'special',
        timezone: 'Europe/Zagreb',
        reservationMode: 'optional',
        priceLabel: '€25',
        ticketUrl: null,
        linkedAnnouncementId: null,
        linkedGlimpseGroupId: null,
        tags: ['smoke', 'admin'],
        galleryMediaIds: [mediaAssetId],
        localizations: {
          hr: {
            title: 'Admin smoke test event',
            teaser: 'Provjera spremanja događaja kroz admin API.',
            description: 'Ovaj događaj služi isključivo za automatsku provjeru admin create i update toka.',
          },
          en: {
            title: 'Admin smoke test event',
            teaser: 'Verifying event persistence through the admin API.',
            description: 'This event exists purely to verify the admin create and update flow.',
          },
        },
      });
    expect(eventCreate.status).toBe(201);
    expect(eventCreate.body.data.slug).toBe('admin-smoke-test-event');

    const glimpseCreate = await agent
      .post('/api/admin/glimpses/groups')
      .set('x-csrf-token', csrfToken)
      .send({
        active: true,
        sortOrder: 90,
        coverMediaId: mediaAssetId,
        localizations: {
          hr: { label: 'Smoke', title: 'Admin smoke grupa' },
          en: { label: 'Smoke', title: 'Admin smoke group' },
        },
      });
    expect(glimpseCreate.status).toBe(201);
    const glimpseGroupId = glimpseCreate.body.data.id as number;

    const glimpseSlideCreate = await agent
      .post('/api/admin/glimpses/slides')
      .set('x-csrf-token', csrfToken)
      .send({
        groupId: glimpseGroupId,
        mediaType: 'image',
        mediaAssetId,
        durationMs: 4200,
        overlayIntensity: 0.45,
        textAlignment: 'left',
        sortOrder: 1,
        ctaUrl: '/reservation',
        localizations: {
          hr: {
            headline: 'Smoke slide',
            body: 'Provjera da admin može dodati slide bez validation errora.',
            ctaLabel: 'Rezerviraj',
          },
          en: {
            headline: 'Smoke slide',
            body: 'Verifies that admin can add a slide without validation errors.',
            ctaLabel: 'Reserve',
          },
        },
      });
    expect(glimpseSlideCreate.status).toBe(201);
    expect(glimpseSlideCreate.body.data.groupId).toBe(glimpseGroupId);
  });

  it('temporarily blocks repeated failed login attempts for the same ip/device combination', async () => {
    const agent = request.agent(app);

    const first = await loginAdmin(agent, { password: 'wrong-password' });
    const second = await loginAdmin(agent, { password: 'wrong-password' });
    const third = await loginAdmin(agent, { password: 'wrong-password' });
    const blocked = await loginAdmin(agent);

    expect(first.status).toBe(401);
    expect(second.status).toBe(401);
    expect(third.status).toBe(401);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('LOGIN_TEMPORARILY_BLOCKED');
    expect(blocked.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('creates reservations and rejects duplicate idempotency keys', async () => {
    const payload = {
      name: 'Ivan Test',
      email: 'ivan@example.com',
      phone: '+38598123456',
      guests: 2,
      date: '2030-08-12',
      time: '19:30',
      area: 'terrace',
      notes: 'Window seat',
      consent: true,
      locale: 'hr',
      honeypot: '',
      submittedAt: new Date().toISOString(),
      idempotencyKey: 'reservation-test-key',
    };

    const first = await request(app).post('/api/reservations').send(payload);
    expect(first.status).toBe(201);
    expect(first.body.data.status).toBeTruthy();

    const duplicate = await request(app).post('/api/reservations').send(payload);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_SUBMISSION');
  });

  it('accepts public contact submissions', async () => {
    const submission = await request(app).post('/api/contact').send({
      name: 'Ana Test',
      email: 'ana@example.com',
      message: 'Zanima me privatni event i dostupnost terase u petak navecer.',
      locale: 'hr',
      honeypot: '',
    });

    expect(submission.status).toBe(201);
    expect(submission.body.data.submitted).toBe(true);
  });

  it('exposes flagship content modules publicly', async () => {
    const announcements = await request(app).get('/api/announcements/active');
    expect(announcements.status).toBe(200);
    expect(Array.isArray(announcements.body.data)).toBe(true);
    expect(announcements.body.data[0].localizations.hr.title).toBeTruthy();

    const glimpses = await request(app).get('/api/glimpses');
    expect(glimpses.status).toBe(200);
    expect(glimpses.body.data[0].slides.length).toBeGreaterThan(0);

    const gallery = await request(app).get('/api/gallery');
    expect(gallery.status).toBe(200);
    expect(gallery.body.data.length).toBeGreaterThan(0);
    expect(gallery.body.data[0].items[0].url.startsWith('/')).toBe(true);
    expect(gallery.body.data.some((collection: { items: Array<{ filename: string }> }) => collection.items.some((item) => item.filename === 'nautica-closeup.jpg'))).toBe(true);

    const faqs = await request(app).get('/api/faqs');
    expect(faqs.status).toBe(200);
    expect(faqs.body.data.length).toBeGreaterThan(0);
    expect(faqs.body.data[0].localizations.hr.question).toBeTruthy();

    const socialFeed = await request(app).get('/api/social-feed');
    expect(socialFeed.status).toBe(200);
    expect(typeof socialFeed.body.data.instagramProfileUrl).toBe('string');
    expect(typeof socialFeed.body.data.facebookPageUrl).toBe('string');
    expect(Array.isArray(socialFeed.body.data.items)).toBe(true);
    expect(typeof socialFeed.body.data.available).toBe('boolean');

    const eventDetail = await request(app).get('/api/events/sunset-sessions-vol-iii');
    expect(eventDetail.status).toBe(200);
    expect(eventDetail.body.data.localizations.hr.teaser).toBeTruthy();
    expect(eventDetail.body.data.imageUrl.startsWith('/site-media/')).toBe(true);
  });
});
