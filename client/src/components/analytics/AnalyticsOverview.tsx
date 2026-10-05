import React, { useState, useEffect } from 'react';
import {
  IAnalyticsOverview,
  IDailyRevenue,
  IStoreRevenue,
  ICategoryRevenue,
  ICustomerGrowth,
  IOrderStatusBreakdown,
  ITopItem,
  ITopCustomer,
} from '../../types/index.js';
import { formatCurrency, formatShortDate, getStatusColor } from '../../lib/formatters.js';
import { StatCard } from '../common/StatCard.js';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Store,
  Star,
  Flame,
  Award,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../lib/axios.js';
import { useToast } from '../../store/toastStore.js';

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

export const AnalyticsOverview: React.FC = () => {
  const [summary, setSummary] = useState<IAnalyticsOverview | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<IDailyRevenue[]>([]);
  const [storeRevenue, setStoreRevenue] = useState<IStoreRevenue[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<ICategoryRevenue[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<ICustomerGrowth[]>([]);
  const [orderStatus, setOrderStatus] = useState<IOrderStatusBreakdown[]>([]);
  const [topItems, setTopItems] = useState<ITopItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<ITopCustomer[]>([]);

  const [daysRange, setDaysRange] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [daysRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        summaryRes,
        dailyRes,
        storeRes,
        catRes,
        custRes,
        statusRes,
        itemsRes,
        topCustRes,
      ] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/analytics/daily-revenue?days=${daysRange}`),
        api.get('/analytics/store-revenue'),
        api.get('/analytics/category-revenue'),
        api.get(`/analytics/customer-growth?days=${daysRange}`),
        api.get('/analytics/order-status'),
        api.get('/analytics/top-items?limit=6'),
        api.get('/analytics/top-customers?limit=6'),
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data.data);
      if (dailyRes.data.success) setDailyRevenue(dailyRes.data.data);
      if (storeRes.data.success) setStoreRevenue(storeRes.data.data);
      if (catRes.data.success) setCategoryRevenue(catRes.data.data);
      if (custRes.data.success) setCustomerGrowth(custRes.data.data);
      if (statusRes.data.success) setOrderStatus(statusRes.data.data);
      if (itemsRes.data.success) setTopItems(itemsRes.data.data);
      if (topCustRes.data.success) setTopCustomers(topCustRes.data.data);
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải dữ liệu phân tích', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Date Range Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Tổng quan Hiệu suất Kinh doanh
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dữ liệu tổng hợp từ MongoDB Aggregation Pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { days: 7, label: '7 ngày qua' },
              { days: 14, label: '14 ngày' },
              { days: 30, label: '30 ngày' },
            ].map((r) => (
              <button
                key={r.days}
                onClick={() => setDaysRange(r.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  daysRange === r.days
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Doanh thu"
          value={formatCurrency(summary.totalRevenue)}
          subtitle="Chỉ tính đơn đã hoàn thành"
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: 18.2, isPositive: true }}
          colorScheme="orange"
        />

        <StatCard
          title="Tổng Đơn hàng"
          value={`${summary.totalOrders} đơn`}
          subtitle={`Giao thành công: ${summary.deliveredOrders}`}
          icon={<ShoppingBag className="w-6 h-6" />}
          trend={{ value: 12.5, isPositive: true }}
          colorScheme="blue"
        />

        <StatCard
          title="Giá trị đơn trung bình"
          value={formatCurrency(summary.avgOrderValue)}
          subtitle="Trung bình mỗi giao dịch"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 4.8, isPositive: true }}
          colorScheme="emerald"
        />

        <StatCard
          title="Điểm Đánh giá TB"
          value={`${summary.avgRating} / 5.0 ⭐`}
          subtitle={`Từ ${summary.totalReviews} lượt đánh giá`}
          icon={<Star className="w-6 h-6" />}
          trend={{ value: 2.1, isPositive: true }}
          colorScheme="amber"
        />
      </div>

      {/* Charts Grid 1: Daily Revenue & Store Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doanh thu theo ngày */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Doanh thu theo ngày
              </h4>
              <p className="text-xs text-slate-400">Biểu đồ xu hướng doanh thu theo thời gian</p>
            </div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg">
              {daysRange} ngày
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
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
                  labelFormatter={(label) => `Ngày: ${label}`}
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
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doanh thu theo Cửa hàng */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Doanh thu theo Chi nhánh Cửa hàng
            </h4>
            <p className="text-xs text-slate-400">So sánh doanh số giữa các chi nhánh trực thuộc</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="storeName"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
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
                <Bar dataKey="totalRevenue" radius={[8, 8, 0, 0]}>
                  {storeRevenue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid 2: Doanh thu theo danh mục & Tỷ lệ trạng thái */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doanh thu theo danh mục */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Doanh thu theo Danh mục Món
            </h4>
            <p className="text-xs text-slate-400">Tỷ trọng đóng góp doanh thu</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {categoryRevenue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
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
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tỷ lệ trạng thái đơn */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Tỷ lệ Trạng thái Đơn hàng
            </h4>
            <p className="text-xs text-slate-400">Phân bố đơn hàng theo trạng thái</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {orderStatus.map((entry, index) => {
                    const colorMeta = getStatusColor(entry.status);
                    return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} đơn`, getStatusColor(name).label]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(val) => getStatusColor(val).label}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tăng trưởng khách hàng */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Tăng trưởng Khách hàng
            </h4>
            <p className="text-xs text-slate-400">Số khách hàng đăng ký mới</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} khách`, 'Mới']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="newCustomers" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top món bán chạy & Top khách hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top món */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Top Món ăn Bán chạy nhất
            </h4>
          </div>

          <div className="space-y-3">
            {topItems.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{it.name}</p>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                      {it.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-xs text-orange-600 dark:text-orange-400">
                    {it.totalQty} phần đã bán
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {formatCurrency(it.totalRevenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Khách hàng */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Top Khách hàng Thân thiết (VIP)
            </h4>
          </div>

          <div className="space-y-3">
            {topCustomers.map((c, idx) => (
              <div
                key={c._id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(c.totalSpent)}
                  </p>
                  <p className="text-[11px] text-slate-400">{c.orderCount} đơn hàng</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
