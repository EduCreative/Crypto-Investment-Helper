import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Portfolio } from './components/Portfolio.tsx';
import { Recommendations } from './components/Recommendations.tsx';
import { LearningCenter } from './components/LearningCenter.tsx';
import { CoinResearch } from './components/CoinResearch.tsx';
import { Compare } from './components/Compare.tsx';
import { PortfolioProvider } from './context/PortfolioContext.tsx';
import type { Page, Coin } from './types.ts';
import { DAppProvider } from './context/DAppContext.tsx';
import { FavoritesProvider } from './context/FavoritesContext.tsx';
import { AlertsProvider } from './context/AlertsContext.tsx';
import { NotificationsProvider } from './context/NotificationsContext.tsx';
import { AlertsPage } from './components/AlertsPage.tsx';
import { NotificationCenter } from './components/NotificationCenter.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const handleSelectCoin = (coin: Coin) => {
    setSelectedCoin(coin);
    setActivePage('Coin Research');
  };

  const renderPage = useMemo(() => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard onCoinSelect={handleSelectCoin} />;
      case 'Portfolio':
        return <Portfolio setActivePage={setActivePage} />;
      case 'Recommendations':
        return <Recommendations />;
      case 'Compare':
        return <Compare onCoinSelect={handleSelectCoin} />;
      case 'Alerts':
        return <AlertsPage />;
      case 'Learning Center':
        return <LearningCenter />;
      case 'Coin Research':
        if (!selectedCoin) {
          // Fallback if page is accessed without a selected coin
          return <Dashboard onCoinSelect={handleSelectCoin} />;
        }
        return <CoinResearch coin={selectedCoin} setActivePage={setActivePage} />;
      default:
        return <Dashboard onCoinSelect={handleSelectCoin} />;
    }
  }, [activePage, selectedCoin]);

  return (
    <ThemeProvider>
      <PortfolioProvider>
        <FavoritesProvider>
          <AlertsProvider>
            <NotificationsProvider>
              <DAppProvider>
                <div className="flex min-h-screen font-sans">
                  <Sidebar activePage={activePage} setActivePage={setActivePage} />
                  <main key={activePage} className="flex-1 p-4 sm:p-6 lg:p-8 ml-16 md:ml-64 transition-all duration-300 animate-page-fade-in">
                    {renderPage}
                  </main>
                  <NotificationCenter />
                </div>
              </DAppProvider>
            </NotificationsProvider>
          </AlertsProvider>
        </FavoritesProvider>
      </PortfolioProvider>
    </ThemeProvider>
  );
};

export default App;