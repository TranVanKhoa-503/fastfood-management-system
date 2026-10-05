import React, { useState } from 'react';
import { useTheme } from '../../store/themeStore.js';
import { useToast } from '../../store/toastStore.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Bell,
  Shield,
  Sun,
  Moon,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'appearance' | 'notifications' | 'security'>('general');

  // General state
  const [restaurantName, setRestaurantName] = useState('FastFood Vietnam Express');
  const [hotline, setHotline] = useState('1900 6868');
  const [taxCode, setTaxCode] = useState('0108899889');
  const [currency, setCurrency] = useState('VND (đ)');

  // Profile state
  const [adminName, setAdminName] = useState('Nguyễn Quản Trị');
  const [adminEmail, setAdminEmail] = useState('admin@fastfood.vn');
  const [adminPhone, setAdminPhone] = useState('0988776655');

  // Notification state
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(false);

  const handleSave = () => {
    addToast('Cài đặt đã được lưu thành công vào hệ thống!', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar tabs */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 space-y-1 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        {[
          { id: 'general', label: 'Cài đặt chung', icon: SettingsIcon },
          { id: 'profile', label: 'Hồ sơ quản trị', icon: User },
          { id: 'appearance', label: 'Giao diện & Theme', icon: Palette },
          { id: 'notifications', label: 'Thông báo', icon: Bell },
          { id: 'security', label: 'Bảo mật & Quyền hạn', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-8">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cài đặt chung</h3>
              <p className="text-xs text-slate-400">Thông tin thương hiệu và hệ thống chuỗi cửa hàng</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Tên thương hiệu FastFood"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
              <Input
                label="Hotline tổng đài CSKH"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
              />
              <Input
                label="Mã số thuế doanh nghiệp"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
              />
              <Input
                label="Đơn vị tiền tệ hiển thị"
                value={currency}
                disabled
              />
            </div>

            <Button onClick={handleSave} variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Lưu thay đổi
            </Button>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hồ sơ Quản trị viên</h3>
              <p className="text-xs text-slate-400">Thông tin tài khoản đăng nhập và liên hệ</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Họ và tên"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
              <Input
                label="Email quản trị"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <Input
                label="Số điện thoại di động"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Cập nhật hồ sơ
            </Button>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Giao diện & Chủ đề</h3>
              <p className="text-xs text-slate-400">Tùy chỉnh chế độ hiển thị sáng / tối và màu sắc</p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Chế độ màu sắc (Theme Mode)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-8 h-8 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Chế độ Sáng (Light)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Chế độ Tối (Dark)</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Giao diện được tối ưu hóa cho màn hình quản lý với độ tương phản cao, kính mờ (glassmorphism) và màu sắc FastFood năng động.
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cấu hình Thông báo</h3>
              <p className="text-xs text-slate-400">Quản lý các sự kiện phát tín hiệu âm thanh và popup</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Thông báo đơn hàng mới</p>
                  <p className="text-[11px] text-slate-400">Phát âm thanh chuông khi có khách đặt món</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewOrder}
                  onChange={(e) => setNotifyNewOrder(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Cảnh báo nguyên liệu / Món sắp hết</p>
                  <p className="text-[11px] text-slate-400">Gửi cảnh báo đến bếp khi số lượng tồn thấp</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLowStock}
                  onChange={(e) => setNotifyLowStock(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Thông báo đánh giá & phản hồi mới</p>
                  <p className="text-[11px] text-slate-400">Nhận thông báo khi khách gửi đánh giá sao</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyReviews}
                  onChange={(e) => setNotifyReviews(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                />
              </label>
            </div>

            <Button onClick={handleSave} variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Lưu cấu hình
            </Button>
          </div>
        )}

        {/* SECURITY TAB (UI CƠ BẢN) */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bảo mật & Quyền truy cập</h3>
              <p className="text-xs text-slate-400">Quản lý mật khẩu và xác thực hai lớp (2FA)</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Mật khẩu hiện tại"
                type="password"
                placeholder="••••••••"
              />
              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="••••••••"
              />
              <Input
                label="Xác nhận mật khẩu mới"
                type="password"
                placeholder="••••••••"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Xác thực 2 yếu tố (2FA)</p>
                <p className="text-[11px] text-slate-400">Bảo vệ tài khoản bằng mã OTP Google Authenticator</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Chưa kích hoạt
              </span>
            </div>

            <Button onClick={handleSave} variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Đổi mật khẩu
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
