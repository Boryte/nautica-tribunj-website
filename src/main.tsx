import { createRoot, hydrateRoot } from 'react-dom/client';
import type { DehydratedState } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './i18n';
import './index.css';

const rootElement = document.getElementById('root');
const dehydratedState = window.__REACT_QUERY_DEHYDRATED_STATE__ as DehydratedState | undefined;
const isAdminPath = window.location.pathname.startsWith('/admin');

if (!rootElement) throw new Error('Root element not found.');

const app = <HelmetProvider><App dehydratedState={dehydratedState} /></HelmetProvider>;

if (isAdminPath) {
  rootElement.innerHTML = '';
  createRoot(rootElement).render(app);
} else if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
