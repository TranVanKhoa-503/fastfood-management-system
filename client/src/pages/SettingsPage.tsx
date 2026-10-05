import React from 'react';
import { SettingsView } from '../components/settings/SettingsView.js';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Cài đặt Hệ thống
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cấu hình chung, hồ sơ tài khoản, tùy chỉnh giao diện sáng/tối và thông báo
        </p>
      </div>

      <SettingsView />
    </div>
  );
};
