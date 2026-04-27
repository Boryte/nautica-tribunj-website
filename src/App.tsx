import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HydrationBoundary, QueryClient, QueryClientProvider, dehydrate, type DehydratedState } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Preloader } from '@/components/Preloader';
import { ProtectedAdminRoute } from '@/admin/ProtectedAdminRoute';
import { AmbientAudioProvider } from '@/components/audio/AmbientAudioProvider';
import { AmbientSoundControl } from '@/components/audio/AmbientSoundControl';
import { CookieConsentProvider } from '@/components/cookies/CookieConsentProvider';
import { PageState } from '@/components/states/PageState';
import { PageTransition } from '@/components/PageTransition';
import { ScrollToTop } from '@/components/ScrollToTop';
import { initializePendingSubmissionSync } from '@/lib/whatsapp';
import { useWebVitals } from '@/hooks/use-web-vitals';
import IndexPage from './pages/Index.tsx';
import AboutPage from './pages/About.tsx';
import MenuPage from './pages/Menu.tsx';
import EventsPage from './pages/Events.tsx';
import EventDetailPage from './pages/EventDetail.tsx';
import ReservationPage from './pages/Reservation.tsx';
import MediaPage from './pages/Gallery.tsx';
import FaqPage from './pages/Faq.tsx';
import PrivacyPage from './pages/Privacy.tsx';
import TermsPage from './pages/Terms.tsx';
import CookiesPage from './pages/Cookies.tsx';
import NotFoundPage from './pages/NotFound.tsx';

const AdminLogin = lazy(() => import('@/admin/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('@/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminAnnouncements = lazy(() => import('@/admin/AdminAnnouncements').then((module) => ({ default: module.AdminAnnouncements })));
const AdminReservations = lazy(() => import('@/admin/AdminReservations').then((module) => ({ default: module.AdminReservations })));
const AdminEvents = lazy(() => import('@/admin/AdminEvents').then((module) => ({ default: module.AdminEvents })));
const AdminFaq = lazy(() => import('@/admin/AdminFaq').then((module) => ({ default: module.AdminFaq })));
const AdminGlimpses = lazy(() => import('@/admin/AdminGlimpses').then((module) => ({ default: module.AdminGlimpses })));
const AdminMedia = lazy(() => import('@/admin/AdminMedia').then((module) => ({ default: module.AdminMedia })));
const AdminMenu = lazy(() => import('@/admin/AdminMenu').then((module) => ({ default: module.AdminMenu })));
const AdminSettings = lazy(() => import('@/admin/AdminSettings').then((module) => ({ default: module.AdminSettings })));

const Index = IndexPage;
const About = AboutPage;
const Menu = MenuPage;
const Events = EventsPage;
const EventDetail = EventDetailPage;
const Reservation = ReservationPage;
const Media = MediaPage;
const Faq = FaqPage;
const Privacy = PrivacyPage;
const Terms = TermsPage;
const Cookies = CookiesPage;
const NotFound = NotFoundPage;

export const createAppQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const routeFallback = <PageState title="Loading" description="Preparing view..." />;

const renderPublicRoutes = (prefix = '') => {
  const base = prefix || '';
  const rootPath = base || '/';
  return (
    <>
      <Route path={rootPath} element={<PageTransition routeKey={`${base || '/'}index`}><Index /></PageTransition>} />
      <Route path={`${base}/about`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}about`}><About /></PageTransition>} />
      <Route path={`${base}/menu`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}menu`}><Menu /></PageTransition>} />
      <Route path={`${base}/events`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}events`}><Events /></PageTransition>} />
      <Route path={`${base}/events/:slug`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}event-detail`}><EventDetail /></PageTransition>} />
      <Route path={`${base}/reservation`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}reservation`}><Reservation /></PageTransition>} />
      <Route path={`${base}/media`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}media`}><Media /></PageTransition>} />
      <Route path={`${base}/gallery`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}gallery`}><Media /></PageTransition>} />
      <Route path={`${base}/faq`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}faq`}><Faq /></PageTransition>} />
      <Route path={`${base}/privacy`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}privacy`}><Privacy /></PageTransition>} />
      <Route path={`${base}/terms`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}terms`}><Terms /></PageTransition>} />
      <Route path={`${base}/cookies`.replace('//', '/')} element={<PageTransition routeKey={`${base || '/'}cookies`}><Cookies /></PageTransition>} />
    </>
  );
};

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={routeFallback}>
        <Routes location={location} key={`${location.pathname}${location.search}`}>
          {renderPublicRoutes()}
          {renderPublicRoutes('/en')}
          <Route path="/admin/login" element={<PageTransition routeKey={location.pathname}><AdminLogin /></PageTransition>} />
          <Route path="/admin" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/announcements" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminAnnouncements /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/faqs" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminFaq /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/glimpses" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminGlimpses /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/media" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminMedia /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/reservations" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminReservations /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/events" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/menu" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminMenu /></ProtectedAdminRoute></PageTransition>} />
          <Route path="/admin/settings" element={<PageTransition routeKey={location.pathname}><ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute></PageTransition>} />
          <Route path="*" element={<PageTransition routeKey={location.pathname}><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const detectPrerenderMode = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('prerender') === '1';
};

type AppShellProps = {
  dehydratedState?: DehydratedState;
  initialQueryClient?: QueryClient;
  isPrerenderMode: boolean;
  renderRouter: (children: ReactNode) => ReactNode;
};

export const AppShell = ({
  dehydratedState,
  initialQueryClient,
  isPrerenderMode,
  renderRouter,
}: AppShellProps) => {
  const [queryClient] = useState(() => initialQueryClient ?? createAppQueryClient());
  const [loaded, setLoaded] = useState(Boolean(dehydratedState) || isPrerenderMode);
  const [showHydratedPreloader, setShowHydratedPreloader] = useState(false);
  const [uiMounted, setUiMounted] = useState(false);
  useWebVitals();

  useEffect(() => {
    if (!isPrerenderMode) {
      initializePendingSubmissionSync();
    }
  }, [isPrerenderMode]);

  useEffect(() => {
    setUiMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isPrerenderMode) return;
    const alreadySeen = window.sessionStorage.getItem('nautica-preloader-seen');
    if (alreadySeen) return;
    window.sessionStorage.setItem('nautica-preloader-seen', '1');
    setShowHydratedPreloader(true);
  }, [isPrerenderMode]);

  useEffect(() => {
    if (!isPrerenderMode || typeof window === 'undefined') return;
    const syncState = () => {
      window.__PRERENDER_DEHYDRATED_STATE__ = dehydrate(queryClient);
    };
    syncState();
    const unsubscribe = queryClient.getQueryCache().subscribe(syncState);
    const intervalId = window.setInterval(syncState, 250);
    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [isPrerenderMode, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <CookieConsentProvider>
          <TooltipProvider>
            <AmbientAudioProvider src="/audio/ambient-sea.mp3" enabledByDefault={!isPrerenderMode}>
              {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
              {showHydratedPreloader ? <Preloader onComplete={() => setShowHydratedPreloader(false)} /> : null}
              {uiMounted ? <Sonner /> : null}
              {renderRouter(
                <>
                  <ScrollToTop />
                  <AnimatedRoutes />
                  {!isPrerenderMode ? <AmbientSoundControl /> : null}
                </>,
              )}
            </AmbientAudioProvider>
          </TooltipProvider>
        </CookieConsentProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
};

const App = ({ dehydratedState }: { dehydratedState?: DehydratedState }) => {
  const isPrerenderMode = useMemo(detectPrerenderMode, []);

  return (
    <AppShell
      dehydratedState={dehydratedState}
      isPrerenderMode={isPrerenderMode}
      renderRouter={(children) => (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {children}
        </BrowserRouter>
      )}
    />
  );
};

export default App;
