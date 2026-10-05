import React from 'react';
import { AnalyticsOverview } from '../components/analytics/AnalyticsOverview.js';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Báo cáo & Phân tích Doanh thu
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Doanh thu theo ngày/chi nhánh/danh mục, tăng trưởng khách hàng, tỷ lệ trạng thái đơn, top món bán chạy & top khách VIP
        </p>
      </div>

      <AnalyticsOverview />
    </div>
  );
};
