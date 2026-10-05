import React, { useState } from 'react';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Bảng điều khiển Tổng quan';
      case 'orders':
        return 'Quản lý Đơn hàng';
      case 'menu':
        return 'Quản lý Thực đơn & Món ăn';
      case 'customers':
        return 'Quản lý Khách hàng';
      case 'stores':
        return 'Hệ thống Chi nhánh Cửa hàng';
      case 'shippers':
        return 'Quản lý Tài xế Giao hàng';
      case 'reviews':
        return 'Đánh giá & Phản hồi Khách hàng';
      case 'analytics':
        return 'Báo cáo & Phân tích Doanh thu';
      case 'settings':
        return 'Cài đặt Hệ thống';
      default:
        return 'FastFood Admin';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row transition-colors">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          pageTitle={getPageTitle(currentTab)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
