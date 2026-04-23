import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { Footer } from '@/lib/ui/Footer';
import { TopNav } from '@/lib/ui/TopNav';

export function RootLayout() {
  const location = useLocation();

  // Scroll to top on route change — otherwise the SPA keeps the previous
  // scroll position when navigating into a new page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <TopNav />
      <main className="flex-1">
        {isLanding ? (
          <Outlet />
        ) : (
          <div className="mx-auto max-w-content px-6 py-10">
            <Outlet />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
