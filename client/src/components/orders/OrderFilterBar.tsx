import React from 'react';
import { Search, Filter, Calendar, Store as StoreIcon } from 'lucide-react';
import { IStore } from '../../types/index.js';

interface OrderFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  storeId: string;
  onStoreChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  stores: IStore[];
  onReset: () => void;
}

export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  storeId,
  onStoreChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  stores,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Top row: Search input & Status Tabs */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách, số điện thoại, địa chỉ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Store dropdown */}
        <div className="w-full md:w-64 flex items-center gap-2">
          <StoreIcon className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={storeId}
            onChange={(e) => onStoreChange(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả chi nhánh</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status quick tabs & Date range */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Status buttons */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ xử lý' },
            { id: 'confirmed', label: 'Đã xác nhận' },
            { id: 'preparing', label: 'Đang nấu' },
            { id: 'ready', label: 'Sẵn sàng' },
            { id: 'out_for_delivery', label: 'Đang giao' },
            { id: 'delivered', label: 'Đã giao' },
            { id: 'cancelled', label: 'Đã hủy' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => onStatusChange(st.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                status === st.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            />
          </div>

          {(search || status !== 'all' || storeId !== 'all' || startDate || endDate) && (
            <button
              onClick={onReset}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer px-2"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
