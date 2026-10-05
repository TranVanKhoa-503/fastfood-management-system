import React, { useState } from 'react';
import { ThemeProvider } from './store/themeStore.js';
import { ToastProvider } from './store/toastStore.js';
import { Layout } from './components/layout/Layout.js';

import { DashboardPage } from './pages/DashboardPage.js';
import { OrdersPage } from './pages/OrdersPage.js';
import { MenuPage } from './pages/MenuPage.js';
import { CustomersPage } from './pages/CustomersPage.js';
import { StoresPage } from './pages/StoresPage.js';
import { ShippersPage } from './pages/ShippersPage.js';
import { ReviewsPage } from './pages/ReviewsPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'orders':
        return <OrdersPage />;
      case 'menu':
        return <MenuPage />;
      case 'customers':
        return <CustomersPage />;
      case 'stores':
        return <StoresPage />;
      case 'shippers':
        return <ShippersPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
          {renderContent()}
        </Layout>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
