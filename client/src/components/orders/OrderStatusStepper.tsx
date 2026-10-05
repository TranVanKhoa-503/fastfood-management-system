import React from 'react';
import { OrderStatus } from '../../types/index.js';
import { Check, Clock, CookingPot, PackageCheck, Bike, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '../../lib/formatters.js';

interface OrderStatusStepperProps {
  status: OrderStatus;
  statusHistory: Array<{ status: OrderStatus; at: string }>;
  onUpdateStatus?: (nextStatus: OrderStatus) => void;
  isUpdating?: boolean;
}

const FLOW_STEPS: Array<{ key: OrderStatus; label: string; icon: any }> = [
  { key: 'pending', label: 'Chờ xử lý', icon: Clock },
  { key: 'confirmed', label: 'Xác nhận', icon: Check },
  { key: 'preparing', label: 'Chế biến', icon: CookingPot },
  { key: 'ready', label: 'Sẵn sàng', icon: PackageCheck },
  { key: 'out_for_delivery', label: 'Đang giao', icon: Bike },
  { key: 'delivered', label: 'Đã giao', icon: CheckCircle2 },
];

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({
  status,
  statusHistory,
  onUpdateStatus,
  isUpdating,
}) => {
  if (status === 'cancelled') {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300">
        <XCircle className="w-6 h-6 shrink-0 text-rose-500" />
        <div>
          <h4 className="font-bold text-sm">Đơn hàng đã bị hủy</h4>
          <p className="text-xs text-rose-600/80 dark:text-rose-400">
            {formatDate(statusHistory[statusHistory.length - 1]?.at)}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = FLOW_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
        {FLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const historyEntry = statusHistory.find((h) => h.status === step.key);

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isCurrent
                    ? 'bg-orange-600 text-white ring-4 ring-orange-100 dark:ring-orange-950/60 scale-110'
                    : isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-bold mt-1.5 text-center hidden sm:block ${
                  isCurrent
                    ? 'text-orange-600 dark:text-orange-400'
                    : isPassed
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              {historyEntry && (
                <span className="text-[10px] text-slate-400 hidden md:block">
                  {new Date(historyEntry.at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Action buttons to advance status */}
      {onUpdateStatus && status !== 'delivered' && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 justify-end">
          {status === 'pending' && (
            <button
              onClick={() => onUpdateStatus('confirmed')}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              ✓ Xác nhận đơn hàng
            </button>
          )}
          {status === 'confirmed' && (
            <button
              onClick={() => onUpdateStatus('preparing')}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              ➔ Chuyển vào bếp chế biến
            </button>
          )}
          {status === 'preparing' && (
            <button
              onClick={() => onUpdateStatus('ready')}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              ➔ Món đã xong (Sẵn sàng giao)
            </button>
          )}
          {status === 'ready' && (
            <button
              onClick={() => onUpdateStatus('out_for_delivery')}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              ➔ Bắt đầu giao hàng
            </button>
          )}
          {status === 'out_for_delivery' && (
            <button
              onClick={() => onUpdateStatus('delivered')}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              ✓ Hoàn thành đơn (Đã giao)
            </button>
          )}
          <button
            onClick={() => onUpdateStatus('cancelled')}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            ✕ Hủy đơn
          </button>
        </div>
      )}
    </div>
  );
};
