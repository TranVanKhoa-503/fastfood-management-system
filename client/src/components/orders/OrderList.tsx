import React, { useState } from 'react';
import { IOrder, OrderStatus } from '../../types/index.js';
import { Badge } from '../common/Badge.js';
import { Button } from '../common/Button.js';
import { formatCurrency, formatDate } from '../../lib/formatters.js';
import { Eye, UserCheck, ChevronRight, ShoppingBag } from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal.js';
import { AssignShipperModal } from './AssignShipperModal.js';
import { EmptyState } from '../common/EmptyState.js';

interface OrderListProps {
  orders: IOrder[];
  loading: boolean;
  onRefresh: () => void;
  onCreateNew: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  loading,
  onRefresh,
  onCreateNew,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [assignShipperOrder, setAssignShipperOrder] = useState<IOrder | null>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Không có đơn hàng nào"
        description="Không tìm thấy đơn hàng nào khớp với điều kiện lọc."
        icon={<ShoppingBag className="w-8 h-8" />}
        actionText="Tạo đơn hàng mới"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Mã đơn</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Chi nhánh</th>
                <th className="px-4 py-3.5">Món & Số lượng</th>
                <th className="px-4 py-3.5 text-right">Tổng tiền</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5">Tài xế</th>
                <th className="px-4 py-3.5">Thời gian</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {orders.map((order) => {
                const totalItemsCount = order.items.reduce((acc, it) => acc + it.qty, 0);

                return (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-4 py-3.5 font-mono font-bold text-orange-600 dark:text-orange-400">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {order.customerId?.name || 'Khách vãng lai'}
                      </p>
                      <p className="text-[11px] text-slate-400">{order.customerId?.phone}</p>
                    </td>

                    {/* Store */}
                    <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {order.storeId?.name || 'Chưa gán'}
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3.5 max-w-xs truncate">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {totalItemsCount} món:
                      </span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {order.items.map((it) => `${it.name} (x${it.qty})`).join(', ')}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 text-center">
                      <Badge status={order.status} />
                    </td>

                    {/* Shipper */}
                    <td className="px-4 py-3.5">
                      {order.shipperId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {order.shipperId.fullName}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssignShipperOrder(order)}
                          className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Gán shipper
                        </button>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={() => {
            onRefresh();
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Assign Shipper Modal */}
      {assignShipperOrder && (
        <AssignShipperModal
          isOpen={!!assignShipperOrder}
          onClose={() => setAssignShipperOrder(null)}
          orderId={assignShipperOrder._id}
          storeId={assignShipperOrder.storeId?._id}
          currentShipperId={assignShipperOrder.shipperId?._id}
          onAssigned={() => {
            onRefresh();
            setAssignShipperOrder(null);
          }}
        />
      )}
    </>
  );
};
