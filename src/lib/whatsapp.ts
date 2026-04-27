import type {
  EventDTO,
  EventRegistrationInput,
  LocaleCode,
  ReservationArea,
  ReservationIntentType,
  ReservationSubmissionInput,
  SiteSettingsDTO,
} from '@shared/index';
import { buildApiUrl } from '@/lib/api';

type PendingSubmission =
  | {
      id: string;
      kind: 'reservation';
      endpoint: '/api/reservations';
      payload: ReservationSubmissionInput;
      createdAt: string;
      attempts: number;
    }
  | {
      id: string;
      kind: 'event_registration';
      endpoint: `/api/events/${number}/register`;
      payload: EventRegistrationInput;
      createdAt: string;
      attempts: number;
    };

const STORAGE_KEY = 'nautica.pending-submissions.v1';
const MAX_ATTEMPTS = 12;

const areaLabels: Record<LocaleCode, Record<ReservationArea, string>> = {
  hr: {
    terrace: 'Terasa',
    indoor: 'Interijer',
    bar: 'Bar',
    vip: 'VIP',
  },
  en: {
    terrace: 'Terrace',
    indoor: 'Indoor',
    bar: 'Bar',
    vip: 'VIP',
  },
};

const intentLabels: Record<LocaleCode, Record<ReservationIntentType, string>> = {
  hr: {
    standard: 'Standardna rezervacija',
    event: 'Event rezervacija',
    special_evening: 'Posebna večer',
    vip: 'VIP rezervacija',
  },
  en: {
    standard: 'Standard reservation',
    event: 'Event reservation',
    special_evening: 'Special evening',
    vip: 'VIP reservation',
  },
};

const terminalSyncStatus = new Set([400, 401, 403, 404, 409, 410, 422]);

let flushPromise: Promise<void> | null = null;
let syncInitialized = false;

const safeParseQueue = (): PendingSubmission[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: PendingSubmission[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

const sanitizeWhatsAppPhone = (value: string) => value.replace(/[^\d]/g, '');

export const resolveWhatsAppPhone = (settings: SiteSettingsDTO) =>
  sanitizeWhatsAppPhone(settings.whatsappPhone || settings.phone);

const buildWhatsAppUrl = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export const openWhatsAppConversation = (url: string) => {
  if (typeof window === 'undefined') return;

  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.assign(url);
  }
};

export const queuePendingSubmission = (item: Omit<PendingSubmission, 'attempts' | 'createdAt'>) => {
  const queue = safeParseQueue();
  queue.push({
    ...item,
    createdAt: new Date().toISOString(),
    attempts: 0,
  } as PendingSubmission);
  writeQueue(queue);
};

const postPendingSubmission = async (item: PendingSubmission) => {
  const response = await fetch(buildApiUrl(item.endpoint), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item.payload),
    keepalive: true,
  });

  if (response.ok) {
    return { terminal: true };
  }

  if (terminalSyncStatus.has(response.status)) {
    return { terminal: true };
  }

  return { terminal: false };
};

export const flushPendingSubmissions = async () => {
  if (typeof window === 'undefined' || flushPromise) return flushPromise ?? Promise.resolve();
  if (!navigator.onLine) return;

  flushPromise = (async () => {
    const queue = safeParseQueue();
    const retained: PendingSubmission[] = [];

    for (const item of queue) {
      if (item.attempts >= MAX_ATTEMPTS) {
        continue;
      }

      try {
        const result = await postPendingSubmission(item);
        if (!result.terminal) {
          retained.push({ ...item, attempts: item.attempts + 1 });
        }
      } catch {
        retained.push({ ...item, attempts: item.attempts + 1 });
      }
    }

    writeQueue(retained);
  })();

  try {
    await flushPromise;
  } finally {
    flushPromise = null;
  }
};

export const initializePendingSubmissionSync = () => {
  if (typeof window === 'undefined' || syncInitialized) return;

  syncInitialized = true;
  window.addEventListener('online', () => {
    void flushPendingSubmissions();
  });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void flushPendingSubmissions();
    }
  });

  void flushPendingSubmissions();
};

const formatNotesBlock = (label: string, value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? `${label}: ${trimmed}` : null;
};

export const buildReservationWhatsAppUrl = ({
  settings,
  locale,
  values,
  notes,
  intentType,
}: {
  settings: SiteSettingsDTO;
  locale: LocaleCode;
  values: Pick<ReservationSubmissionInput, 'name' | 'email' | 'phone' | 'guests' | 'date' | 'time' | 'area'>;
  notes?: string;
  intentType: ReservationIntentType;
}) => {
  const phone = resolveWhatsAppPhone(settings);
  const lines = [
    locale === 'hr' ? `Nova rezervacija za ${settings.businessName}` : `New reservation for ${settings.businessName}`,
    `${locale === 'hr' ? 'Tip' : 'Type'}: ${intentLabels[locale][intentType]}`,
    `${locale === 'hr' ? 'Ime i prezime' : 'Name'}: ${values.name}`,
    `${locale === 'hr' ? 'Telefon' : 'Phone'}: ${values.phone}`,
    `${locale === 'hr' ? 'Email' : 'Email'}: ${values.email}`,
    `${locale === 'hr' ? 'Broj gostiju' : 'Guests'}: ${values.guests}`,
    `${locale === 'hr' ? 'Datum' : 'Date'}: ${values.date}`,
    `${locale === 'hr' ? 'Vrijeme' : 'Time'}: ${values.time}`,
    `${locale === 'hr' ? 'Prostor' : 'Area'}: ${areaLabels[locale][values.area]}`,
    formatNotesBlock(locale === 'hr' ? 'Napomene' : 'Notes', notes),
  ].filter(Boolean);

  return buildWhatsAppUrl(phone, lines.join('\n'));
};

export const buildEventReservationWhatsAppUrl = ({
  settings,
  locale,
  event,
  values,
}: {
  settings: SiteSettingsDTO;
  locale: LocaleCode;
  event: EventDTO;
  values: EventRegistrationInput;
}) => {
  const phone = resolveWhatsAppPhone(settings);
  const eventLocale = event.localizations[locale] ?? event.localizations.hr;
  const lines = [
    locale === 'hr' ? `Nova event rezervacija za ${settings.businessName}` : `New event reservation for ${settings.businessName}`,
    `${locale === 'hr' ? 'Događaj' : 'Event'}: ${eventLocale.title}`,
    `${locale === 'hr' ? 'Početak' : 'Starts'}: ${event.startsAt}`,
    `${locale === 'hr' ? 'Ime i prezime' : 'Name'}: ${values.name}`,
    `${locale === 'hr' ? 'Telefon' : 'Phone'}: ${values.phone}`,
    `${locale === 'hr' ? 'Email' : 'Email'}: ${values.email}`,
    `${locale === 'hr' ? 'Način rezervacije' : 'Reservation mode'}: ${event.reservationMode}`,
    `${locale === 'hr' ? 'Slug događaja' : 'Event slug'}: ${event.slug}`,
  ];

  return buildWhatsAppUrl(phone, lines.join('\n'));
};
