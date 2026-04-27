import { ReactNode } from 'react';
import { CookieConsentBanner } from './cookies/CookieConsentBanner';
import { CookiePreferencesDialog } from './cookies/CookiePreferencesDialog';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="public-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <CookieConsentBanner />
      <CookiePreferencesDialog />
    </div>
  );
};
