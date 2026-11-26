import { useEffect, useState } from 'react';
import { AdminApp } from './admin/AdminApp';
import { StorefrontApp } from './storefront/StorefrontApp';

function resolveInitialRoute(): 'admin' | 'storefront' {
  const mode = (import.meta.env.VITE_APP_MODE || 'monorepo').trim();
  if (mode === 'admin') return 'admin';
  if (mode === 'storefront') return 'storefront';

  const adminHost = (import.meta.env.VITE_ADMIN_HOST || '').trim().toLowerCase();
  if (adminHost && typeof window !== 'undefined') {
    if (window.location.hostname.toLowerCase() === adminHost) {
      return 'admin';
    }
  }

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return 'admin';
  }
  return 'storefront';
}

export function AppRouter() {
  const [route, setRoute] = useState<'admin' | 'storefront'>(resolveInitialRoute);
  const mode = (import.meta.env.VITE_APP_MODE || 'monorepo').trim();

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (target: 'admin' | 'storefront') => {
    if (mode === 'admin' || mode === 'storefront') return;
    const nextPath = target === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setRoute(target);
    window.scrollTo({ top: 0 });
  };

  if (route === 'admin') {
    return (
      <AdminApp
        showStorefrontLink={mode === 'monorepo'}
        onNavigateStorefront={() => navigateTo('storefront')}
      />
    );
  }

  return (
    <StorefrontApp
      canOpenAdmin={mode === 'monorepo'}
      onOpenAdmin={() => navigateTo('admin')}
    />
  );
}
