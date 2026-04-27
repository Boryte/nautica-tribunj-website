import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, KeyRound, LockKeyhole, RefreshCcw, ShieldCheck, TimerReset } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminSession } from '@/hooks/use-site-data';
import { api, ApiClientError } from '@/lib/api';

const ADMIN_DEVICE_KEY = 'nautica-admin-device-id';

const createDeviceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `nautica-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isValidDeviceId = (value: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length >= 8 && trimmed.length <= 128;
};

const getClientDeviceId = () => {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(ADMIN_DEVICE_KEY);
  if (isValidDeviceId(existing)) return existing;

  const next = createDeviceId();
  window.localStorage.setItem(ADMIN_DEVICE_KEY, next);
  return next;
};

const formatRetryTime = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return null;
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
};

const getLoginClientValidationError = ({
  email,
  password,
  challengeReady,
  challengeAnswer,
  requiresTwoFactor,
  oneTimeCode,
  deviceId,
}: {
  email: string;
  password: string;
  challengeReady: boolean;
  challengeAnswer: string;
  requiresTwoFactor: boolean;
  oneTimeCode: string;
  deviceId: string;
}) => {
  if (!deviceId) return 'Device security context is still initializing. Refresh and try again.';
  if (!challengeReady) return 'Security check is not ready yet. Refresh the challenge and try again.';
  if (!email.trim()) return 'Email is required.';
  if (!password) return 'Password is required.';
  if (!challengeAnswer.trim()) return 'Challenge answer is required.';
  if (requiresTwoFactor && oneTimeCode.trim().length !== 6) return 'Authenticator code must contain 6 digits.';
  return null;
};

export const AdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: session } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [deviceId, setDeviceId] = useState('');

  const destination = (location.state as { from?: string } | null)?.from ?? '/admin';

  useEffect(() => {
    if (session?.authenticated) navigate(destination, { replace: true });
  }, [destination, navigate, session?.authenticated]);

  useEffect(() => {
    setDeviceId(getClientDeviceId());
  }, []);

  const challengeQuery = useQuery({
    queryKey: ['admin-login-challenge'],
    queryFn: () => api.getAdminLoginChallenge(),
    retry: false,
    enabled: !!deviceId && !session?.authenticated,
  });

  const challenge = challengeQuery.data;

  useEffect(() => {
    if (challenge?.challengeId) setChallengeAnswer('');
  }, [challenge?.challengeId]);

  useEffect(() => {
    if (!challenge?.requiresTwoFactor) setOneTimeCode('');
  }, [challenge?.requiresTwoFactor]);

  const loginMutation = useMutation({
    mutationFn: () => {
      const clientValidationError = getLoginClientValidationError({
        email,
        password,
        challengeReady: Boolean(challenge?.challengeId),
        challengeAnswer,
        requiresTwoFactor: Boolean(challenge?.requiresTwoFactor),
        oneTimeCode,
        deviceId,
      });

      if (clientValidationError) {
        throw new ApiClientError(clientValidationError, 'LOGIN_FORM_INCOMPLETE');
      }

      return api.adminLogin({
        email: email.trim(),
        password,
        deviceId,
        challengeId: challenge.challengeId,
        challengeAnswer: challengeAnswer.trim(),
        oneTimeCode: challenge.requiresTwoFactor ? oneTimeCode.trim() : undefined,
      });
    },
    onSuccess: async (result) => {
      queryClient.setQueryData(['admin-session'], result);
      await queryClient.invalidateQueries({ queryKey: ['admin-session'] });
      navigate(destination, { replace: true });
    },
    onError: async (error) => {
      if (!(error instanceof ApiClientError)) return;

      if (
        ['LOGIN_CHALLENGE_INVALID', 'LOGIN_CHALLENGE_EXPIRED', 'LOGIN_CHALLENGE_BLOCKED', 'INVALID_CREDENTIALS', 'ADMIN_2FA_INVALID', 'ADMIN_2FA_REQUIRED'].includes(
          error.code
        )
      ) {
        await challengeQuery.refetch();
      }
    },
  });

  const retryAfterSeconds =
    loginMutation.error instanceof ApiClientError && typeof loginMutation.error.details?.retryAfterSeconds === 'number'
      ? loginMutation.error.details.retryAfterSeconds
      : undefined;

  const errorMessage = useMemo(() => {
    if (!(loginMutation.error instanceof ApiClientError)) return null;

    if (loginMutation.error.code === 'LOGIN_TEMPORARILY_BLOCKED') {
      const hint = formatRetryTime(retryAfterSeconds);
      return hint ? `${loginMutation.error.message} Try again in about ${hint}.` : loginMutation.error.message;
    }

     if (loginMutation.error.code === 'VALIDATION_ERROR') {
      const fieldErrors = loginMutation.error.fieldErrors ?? {};
      const challengeFieldError = fieldErrors.challengeAnswer?.find((value) => typeof value === 'string');
      const otpFieldError = fieldErrors.oneTimeCode?.find((value) => typeof value === 'string');
      const emailFieldError = fieldErrors.email?.find((value) => typeof value === 'string');
      const passwordFieldError = fieldErrors.password?.find((value) => typeof value === 'string');
      const firstFieldError = [challengeFieldError, otpFieldError, emailFieldError, passwordFieldError]
        .find((value) => typeof value === 'string');

      if (firstFieldError === 'Required') {
        return 'Login request is incomplete. Refresh the page and try again.';
      }

      return firstFieldError ?? 'Login request is incomplete. Refresh the page and try again.';
    }

    return loginMutation.error.message;
  }, [loginMutation.error, retryAfterSeconds]);

  const challengeMeta = useMemo(() => {
    if (!challenge) return null;
    const expiresAt = new Date(challenge.expiresAt);
    return Number.isNaN(expiresAt.getTime()) ? null : expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [challenge]);

  const securityNotes = [
    {
      icon: ShieldCheck,
      title: 'Adaptive lockouts',
      body: 'Failed attempts are tracked across account, device, and IP combinations to slow down credential stuffing and brute force attacks.',
    },
    {
      icon: KeyRound,
      title: 'One-time challenge',
      body: 'Each login requires a short human verification step tied to this browser session before credentials are accepted.',
    },
    {
      icon: TimerReset,
      title: 'Session binding',
      body: 'Admin sessions are pinned to the active browser fingerprint in production, reducing stolen-cookie replay risk.',
    },
    {
      icon: LockKeyhole,
      title: 'Optional 2FA',
      body: 'An authenticator-based second factor can be enforced from environment settings without changing the admin UI flow.',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(129,88,39,0.18),transparent_30rem),radial-gradient(circle_at_bottom_left,rgba(173,122,60,0.1),transparent_24rem),linear-gradient(180deg,#07111a,#0b1520_42%,#0f1d2b)] px-4 py-4 text-primary-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1440px] overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_50px_160px_-80px_rgba(0,0,0,0.92)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/8 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,167,92,0.2),transparent_26rem),linear-gradient(160deg,rgba(8,15,22,0.2),rgba(8,15,22,0.75)_58%,rgba(5,11,18,0.96))]" />
          <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.38em] text-[hsl(var(--brand-gold))]">Nautica admin</p>
              <h1 className="mt-6 max-w-xl font-display text-6xl leading-[0.88] text-white">
                Protected operations for reservations, events, media, and live venue updates.
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-7 text-white/60">
                The control surface stays restrained, but the auth flow is stricter now: verification challenge, adaptive throttling, and browser-bound sessions.
              </p>
            </div>

            <div className="grid gap-4">
              {securityNotes.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
                    <Icon className="h-5 w-5 text-[hsl(var(--brand-gold))]" />
                    <p className="mt-4 font-display text-2xl text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-white/56">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex min-h-full items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="w-full max-w-[34rem]">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-6 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-body text-[10px] uppercase tracking-[0.35em] text-[hsl(var(--brand-gold))]">Secure sign-in</p>
                  <h2 className="mt-4 font-display text-4xl text-white sm:text-5xl">{t('admin.login_title')}</h2>
                  <p className="mt-4 max-w-lg font-body text-sm leading-7 text-primary-foreground/68">
                    Sign in to the Nautica operations panel. Human verification and adaptive lockouts are active.
                  </p>
                </div>
                <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.26em] text-white/50 sm:block">
                  Protected
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:hidden">
                {securityNotes.slice(0, 2).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                        <p className="text-xs uppercase tracking-[0.22em] text-white/52">{item.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                className="mt-10 space-y-5"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  loginMutation.mutate();
                }}
              >
                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-white/42">Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-[1.2rem] border border-primary-foreground/12 bg-primary-foreground/5 px-5 py-4 font-body text-sm text-white"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@yourdomain.com"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-white/42">Password</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[1.2rem] border border-primary-foreground/12 bg-primary-foreground/5 px-5 py-4 font-body text-sm text-white"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                </label>
                {challenge?.requiresTwoFactor ? (
                  <label className="block space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-white/42">Authenticator code</span>
                    <input
                      value={oneTimeCode}
                      onChange={(event) => setOneTimeCode(event.target.value.replace(/\D+/g, '').slice(0, 6))}
                      className="w-full rounded-[1.2rem] border border-primary-foreground/12 bg-primary-foreground/5 px-5 py-4 font-body text-sm tracking-[0.35em] text-white"
                      type="text"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      placeholder="123456"
                    />
                  </label>
                ) : null}
                <div className="rounded-[1.35rem] border border-white/10 bg-black/15 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--brand-gold))]">Human check</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {challengeQuery.isLoading ? 'Loading a one-time verification challenge...' : challenge?.prompt ?? 'Unable to load the current challenge.'}
                      </p>
                      {challengeMeta ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">Expires around {challengeMeta}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => challengeQuery.refetch()}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:bg-white/[0.08] hover:text-white"
                      aria-label="Refresh verification challenge"
                    >
                      <RefreshCcw className={`h-4 w-4 ${challengeQuery.isFetching ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <label className="mt-4 block space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-white/42">Answer</span>
                    <input
                      value={challengeAnswer}
                      onChange={(event) => setChallengeAnswer(event.target.value.toUpperCase())}
                      className="w-full rounded-[1.2rem] border border-primary-foreground/12 bg-primary-foreground/5 px-5 py-4 font-body text-sm uppercase tracking-[0.2em] text-white"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Type the reversed code"
                    />
                  </label>
                </div>
                {errorMessage && (
                  <div className="rounded-[1rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p>{errorMessage}</p>
                        {retryAfterSeconds ? (
                          <p className="mt-1 text-rose-100/70">The lockout is temporary and tied to your current login path.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--brand-gold))] px-5 py-4 font-body text-[11px] uppercase tracking-[0.28em] text-[hsl(var(--text-inverse))]"
                  type="submit"
                  disabled={
                    loginMutation.isPending ||
                    challengeQuery.isLoading ||
                    !deviceId ||
                    !challenge?.challengeId ||
                    !challengeAnswer.trim() ||
                    (challenge?.requiresTwoFactor && oneTimeCode.trim().length !== 6) ||
                    !email.trim() ||
                    !password
                  }
                >
                  {loginMutation.isPending ? t('common.loading') : t('admin.login_title')}
                  {!loginMutation.isPending ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
                <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-white/[0.025] px-4 py-3 text-xs text-white/45">
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                    <span>Device fingerprint active</span>
                  </div>
                  <span className="max-w-[11rem] truncate uppercase tracking-[0.16em]">{deviceId || 'initializing'}</span>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
