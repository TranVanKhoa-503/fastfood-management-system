import React, { lazy, Suspense, useState } from 'react';
import { ThemeProvider } from './store/themeStore.js';
import { ToastProvider } from './store/toastStore.js';
import { Layout } from './components/layout/Layout.js';

const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then((page) => ({ default: page.DashboardPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage.js').then((page) => ({ default: page.OrdersPage })));
const MenuPage = lazy(() => import('./pages/MenuPage.js').then((page) => ({ default: page.MenuPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage.js').then((page) => ({ default: page.CustomersPage })));
const StoresPage = lazy(() => import('./pages/StoresPage.js').then((page) => ({ default: page.StoresPage })));
const ShippersPage = lazy(() => import('./pages/ShippersPage.js').then((page) => ({ default: page.ShippersPage })));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage.js').then((page) => ({ default: page.ReviewsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.js').then((page) => ({ default: page.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.js').then((page) => ({ default: page.SettingsPage })));

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
          <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500" role="status">Đang tải màn hình...</div>}>
            {renderContent()}
          </Suspense>
        </Layout>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
