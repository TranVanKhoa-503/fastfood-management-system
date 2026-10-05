import React from 'react';
import { IShipper } from '../../types/index.js';
import { Badge } from '../common/Badge.js';
import { Bike, Phone, Store, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.js';

interface ShipperListProps {
  shippers: IShipper[];
  loading: boolean;
  onEdit: (shipper: IShipper) => void;
  onDelete: (shipper: IShipper) => void;
  onCreateNew: () => void;
  onToggleStatus: (shipper: IShipper, nextStatus: 'available' | 'busy' | 'offline') => void;
}

export const ShipperList: React.FC<ShipperListProps> = ({
  shippers,
  loading,
  onEdit,
  onDelete,
  onCreateNew,
  onToggleStatus,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-52 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (shippers.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy tài xế"
        description="Chưa có tài xế nào khớp với bộ lọc."
        icon={<Bike className="w-8 h-8" />}
        actionText="Thêm tài xế mới"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {shippers.map((shp) => {
        const storeName = typeof shp.storeId === 'object' ? shp.storeId?.name : 'Chưa gán';

        return (
          <div
            key={shp._id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {shp.fullName}
                    </h3>
                    <Badge status={shp.status} />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(shp)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Sửa thông tin"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(shp)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Xóa tài xế"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Shipper Details */}
              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-white">{shp.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{storeName}</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Biển số: {shp.licensePlate}</span>
                  <span className="text-slate-400">{shp.vehicle}</span>
                </div>
              </div>
            </div>

            {/* Bottom active delivery indicator & Quick status changer */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Đơn đang giao:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (shp.activeOrdersCount || 0) > 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {shp.activeOrdersCount || 0}
                </span>
              </div>

              {/* Status toggle buttons */}
              <div className="flex items-center gap-1">
                {shp.status !== 'available' && (
                  <button
                    onClick={() => onToggleStatus(shp, 'available')}
                    className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-semibold cursor-pointer"
                  >
                    Sẵn sàng
                  </button>
                )}
                {shp.status !== 'busy' && (
                  <button
                    onClick={() => onToggleStatus(shp, 'busy')}
                    className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-semibold cursor-pointer"
                  >
                    Bận
                  </button>
                )}
                {shp.status !== 'offline' && (
                  <button
                    onClick={() => onToggleStatus(shp, 'offline')}
                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[10px] font-semibold cursor-pointer"
                  >
                    Offline
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
