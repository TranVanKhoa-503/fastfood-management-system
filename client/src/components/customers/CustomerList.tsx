import React, { useState } from 'react';
import { ICustomer } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../lib/formatters.js';
import { Eye, Edit2, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.js';

interface CustomerListProps {
  customers: ICustomer[];
  loading: boolean;
  onView: (customer: ICustomer) => void;
  onEdit: (customer: ICustomer) => void;
  onDelete: (customer: ICustomer) => void;
  onCreateNew: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading,
  onView,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy khách hàng"
        description="Không có khách hàng nào khớp với tìm kiếm của bạn."
        actionText="Thêm khách hàng mới"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3.5">Khách hàng</th>
              <th className="px-4 py-3.5">Liên hệ</th>
              <th className="px-4 py-3.5">Địa chỉ giao hàng</th>
              <th className="px-4 py-3.5 text-center">Số đơn</th>
              <th className="px-4 py-3.5 text-right">Tổng chi tiêu</th>
              <th className="px-4 py-3.5">Ngày tham gia</th>
              <th className="px-4 py-3.5 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {customers.map((cust) => (
              <tr
                key={cust._id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Customer name & Avatar */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {cust.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{cust.name}</p>
                      <p className="text-[11px] text-slate-400">ID: #{cust._id.slice(-5)}</p>
                    </div>
                  </div>
                </td>

                {/* Contact info */}
                <td className="px-4 py-3.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{cust.email}</span>
                  </div>
                </td>

                {/* Address */}
                <td className="px-4 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                    <span className="truncate">{cust.address}</span>
                  </div>
                </td>

                {/* Order count */}
                <td className="px-4 py-3.5 text-center font-semibold">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                    {cust.orderCount || 0}
                  </span>
                </td>

                {/* Total spent */}
                <td className="px-4 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(cust.totalSpent || 0)}
                </td>

                {/* Created Date */}
                <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                  {formatDate(cust.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onView(cust)}
                      title="Xem lịch sử đơn hàng"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(cust)}
                      title="Sửa thông tin"
                      className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(cust)}
                      title="Xóa khách hàng"
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
