import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './components/Dashboard.js';
import { Portfolio } from './components/Portfolio.js';
import { Recommendations } from './components/Recommendations.js';
import { LearningCenter } from './components/LearningCenter.js';
import { CoinResearch } from './components/CoinResearch.js';
import { Compare } from './components/Compare.js';
import { PortfolioProvider } from './context/PortfolioContext.js';
import type { Page, Coin } from './types.js';
import { DAppProvider } from './context/DAppContext.js';
import { FavoritesProvider } from './context/FavoritesContext.js';
import { AlertsProvider } from './context/AlertsContext.js';
import { NotificationsProvider } from './context/NotificationsContext.js';
import { AlertsPage } from './components/AlertsPage.js';
import { NotificationCenter } from './components/NotificationCenter.js';
import { ThemeProvider } from './context/ThemeContext.js';

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