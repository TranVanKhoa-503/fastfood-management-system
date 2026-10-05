import React, { useState, useEffect } from 'react';
import {
  IAnalyticsOverview,
  IOrder,
  IDailyRevenue,
  IStoreRevenue,
} from '../types/index.js';
import { StatCard } from '../components/common/StatCard.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { formatCurrency, formatShortDate, formatDate } from '../lib/formatters.js';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Plus,
  ArrowRight,
  Store,
  Bike,
  Star,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../lib/axios.js';
import { CreateOrderModal } from '../components/orders/CreateOrderModal.js';
import { OrderDetailModal } from '../components/orders/OrderDetailModal.js';
import { useToast } from '../store/toastStore.js';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<IAnalyticsOverview | null>(null);
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<IDailyRevenue[]>([]);
  const [storeRevenue, setStoreRevenue] = useState<IStoreRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, ordersRes, dailyRes, storeRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/orders?limit=6&sortBy=createdAt&sortOrder=desc'),
        api.get('/analytics/daily-revenue?days=14'),
        api.get('/analytics/store-revenue'),
      ]);

      if (overviewRes.data.success) setSummary(overviewRes.data.data);
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.data.orders);
      if (dailyRes.data.success) setDailyRevenue(dailyRes.data.data);
      if (storeRes.data.success) setStoreRevenue(storeRes.data.data);
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải dữ liệu Dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-6 sm:p-8 text-white shadow-xl shadow-orange-600/15">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
              Hệ thống Quản lý Chuỗi FastFood
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Xin chào, Chúc ngày kinh doanh đại thắng! 🍔
            </h2>
            <p className="text-orange-100 text-xs sm:text-sm mt-1 max-w-xl">
              Theo dõi đơn hàng thời gian thực, quản lý chi nhánh, tài xế giao hàng và hiệu suất bán hàng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg font-bold border-none"
            >
              + Tạo Đơn Hàng Mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh thu hoàn tất"
          value={formatCurrency(summary?.totalRevenue || 0)}
          subtitle={`${summary?.deliveredOrders || 0} đơn giao thành công`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: 14.5, isPositive: true }}
          colorScheme="orange"
        />

        <StatCard
          title="Tổng Đơn tiếp nhận"
          value={`${summary?.totalOrders || 0} đơn`}
          subtitle={`Hủy: ${summary?.cancelledOrders || 0} đơn`}
          icon={<ShoppingBag className="w-6 h-6" />}
          trend={{ value: 8.2, isPositive: true }}
          colorScheme="blue"
        />

        <StatCard
          title="Khách hàng thành viên"
          value={`${summary?.totalCustomers || 0} khách`}
          subtitle="Tích điểm & thân thiết"
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 12.0, isPositive: true }}
          colorScheme="purple"
        />

        <StatCard
          title="Chi nhánh & Đánh giá"
          value={`${summary?.totalStores || 0} Chi nhánh`}
          subtitle={`Đánh giá TB: ${summary?.avgRating || 5.0} ⭐`}
          icon={<Store className="w-6 h-6" />}
          trend={{ value: 5.0, isPositive: true }}
          colorScheme="emerald"
        />
      </div>

      {/* Mid Section: Revenue Chart & Store snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue 14 days chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Xu hướng Doanh thu 14 Ngày qua
              </h3>
              <p className="text-xs text-slate-400">Doanh thu giao thành công hàng ngày</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết báo cáo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Doanh thu']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch quick list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Chi nhánh nổi bật</h3>
            <button
              onClick={() => onNavigate('stores')}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {storeRevenue.slice(0, 4).map((st) => (
              <div
                key={st.storeId}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {st.storeName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{st.totalOrders} đơn hàng</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-xs text-orange-600 dark:text-orange-400">
                    {formatCurrency(st.totalRevenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Đơn hàng Mới nhất
            </h3>
            <p className="text-xs text-slate-400">Cập nhật đơn hàng đặt gần đây</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả đơn hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3.5 py-3">Mã đơn</th>
                <th className="px-3.5 py-3">Khách hàng</th>
                <th className="px-3.5 py-3">Chi nhánh</th>
                <th className="px-3.5 py-3">Món</th>
                <th className="px-3.5 py-3 text-right">Tổng tiền</th>
                <th className="px-3.5 py-3 text-center">Trạng thái</th>
                <th className="px-3.5 py-3">Thời gian</th>
                <th className="px-3.5 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {recentOrders.map((ord) => (
                <tr
                  key={ord._id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-3.5 py-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                    #{ord._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-3.5 py-3 font-semibold">
                    {ord.customerId?.name || 'Khách vãng lai'}
                  </td>
                  <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300">
                    {ord.storeId?.name}
                  </td>
                  <td className="px-3.5 py-3 max-w-xs truncate text-slate-500 dark:text-slate-400">
                    {ord.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                  </td>
                  <td className="px-3.5 py-3 text-right font-black text-slate-900 dark:text-white">
                    {formatCurrency(ord.totalAmount)}
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <Badge status={ord.status} />
                  </td>
                  <td className="px-3.5 py-3 text-slate-400 text-[11px]">
                    {formatDate(ord.createdAt)}
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {createModalOpen && (
        <CreateOrderModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            fetchDashboardData();
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={() => {
            fetchDashboardData();
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};
