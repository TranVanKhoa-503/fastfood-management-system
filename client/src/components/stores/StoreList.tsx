import React from 'react';
import { IStore } from '../../types/index.js';
import { formatCurrency } from '../../lib/formatters.js';
import { Badge } from '../common/Badge.js';
import { Store, MapPin, Phone, Clock, DollarSign, ShoppingBag, Edit2, Trash2, Navigation } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.js';

interface StoreListProps {
  stores: IStore[];
  loading: boolean;
  onEdit: (store: IStore) => void;
  onDelete: (store: IStore) => void;
  onCreateNew: () => void;
}

export const StoreList: React.FC<StoreListProps> = ({
  stores,
  loading,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <EmptyState
        title="Chưa có cửa hàng nào"
        description="Hãy thêm chi nhánh đầu tiên để bắt đầu phục vụ thực khách."
        icon={<Store className="w-8 h-8" />}
        actionText="Thêm chi nhánh mới"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {stores.map((store) => {
        const lng = store.location?.coordinates?.[0];
        const lat = store.location?.coordinates?.[1];

        return (
          <div
            key={store._id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {store.name}
                    </h3>
                    <Badge status={store.status} />
                  </div>
                </div>

                {/* Edit / Delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(store)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Chỉnh sửa chi nhánh"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(store)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Xóa chi nhánh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details list */}
              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {store.phone}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {store.openHours?.open || '08:00'} - {store.openHours?.close || '22:00'}
                  </span>
                </div>

                {lng !== undefined && lat !== undefined && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Navigation className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>
                      GeoPoint: [{lng.toFixed(4)}, {lat.toFixed(4)}]
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue & Stats Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400">Doanh thu</p>
                <p className="text-xs font-black text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatCurrency(store.totalRevenue || 0)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400">Tổng đơn</p>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                  {store.totalOrders || 0} đơn
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
