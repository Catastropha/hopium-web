import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { RootLayout } from '@/RootLayout';
import { CreatePage } from '@/page/create/page';
import { DocsPage } from '@/page/docs/page';
import { LandingPage } from '@/page/landing/page';
import { LeaderboardPage } from '@/page/leaderboard/page';
import { MarketPage } from '@/page/market/page';
import { MarketsPage } from '@/page/markets/page';
import { MyBetsPage } from '@/page/mybets/page';
import { StakePage } from '@/page/stake/page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'markets', element: <MarketsPage /> },
      { path: 'create', element: <CreatePage /> },
      { path: 'market/:address', element: <MarketPage /> },
      { path: 'mine', element: <MyBetsPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'stake', element: <StakePage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: 'docs/:slug', element: <DocsPage /> },
      { path: '*', element: <LandingPage /> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
