import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { IOrder, OrderStatus } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../lib/formatters.js';
import { OrderStatusStepper } from './OrderStatusStepper.js';
import { AssignShipperModal } from './AssignShipperModal.js';
import {
  User,
  Store,
  Bike,
  CreditCard,
  MapPin,
  Calendar,
  FileText,
  UserPlus,
} from 'lucide-react';
import api from '../../lib/axios.js';
import { useToast } from '../../store/toastStore.js';

interface OrderDetailModalProps {
  order: IOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { addToast } = useToast();

  if (!order) return null;

  const handleUpdateStatus = async (nextStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/orders/${order._id}/status`, { status: nextStatus });
      if (res.data.success) {
        addToast(`Cập nhật trạng thái thành "${nextStatus}" thành công!`, 'success');
        onOrderUpdated();
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi cập nhật trạng thái đơn', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Chi tiết Đơn hàng #${order._id.slice(-6).toUpperCase()}`}
        subtitle={`Tạo lúc: ${formatDate(order.createdAt)}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Status Stepper */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Tiến trình xử lý đơn hàng
            </h4>
            <OrderStatusStepper
              status={order.status}
              statusHistory={order.statusHistory}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={updatingStatus}
            />
          </div>

          {/* Grid Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Info */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                <User className="w-4 h-4 text-orange-600" />
                <span>Khách hàng</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {order.customerId?.name || 'Khách vãng lai'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {order.customerId?.phone || '-'}
              </p>
              {order.customerId?.email && (
                <p className="text-xs text-slate-400 truncate">{order.customerId.email}</p>
              )}
            </div>

            {/* Store Info */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Cửa hàng phục vụ</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {order.storeId?.name || 'N/A'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {order.storeId?.phone || '-'}
              </p>
              <p className="text-xs text-slate-400 truncate">{order.storeId?.address}</p>
            </div>

            {/* Shipper Info */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Tài xế giao hàng</span>
                </div>
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {order.shipperId ? 'Đổi' : 'Gán'}
                </button>
              </div>
              {order.shipperId ? (
                <>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {order.shipperId.fullName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {order.shipperId.phone} • {order.shipperId.licensePlate}
                  </p>
                  <Badge status={order.shipperId.status || 'available'} />
                </>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-slate-400 italic">Chưa có tài xế nào được gán</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full text-xs"
                    onClick={() => setAssignModalOpen(true)}
                  >
                    + Gán tài xế ngay
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Payment meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-500 dark:text-slate-400 block">
                  Địa chỉ nhận hàng:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {order.deliveryAddress}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-500 dark:text-slate-400 block">
                  Phương thức thanh toán:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 uppercase font-mono">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Note if any */}
          {order.note && (
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Ghi chú từ khách: </span>
                <span>{order.note}</span>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Danh sách món đã đặt ({order.items.length})
            </h4>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tên món</th>
                    <th className="px-4 py-3 text-center">Số lượng</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold">{it.name}</td>
                      <td className="px-4 py-3 text-center">x{it.qty}</td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                        {formatCurrency(it.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(it.price * it.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Price summary footer */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(order.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-orange-600 dark:text-orange-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Tổng cộng thanh toán:</span>
                  <span className="text-base font-black">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Shipper Assignment Sub-Modal */}
      {assignModalOpen && (
        <AssignShipperModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          orderId={order._id}
          storeId={order.storeId?._id}
          currentShipperId={order.shipperId?._id}
          onAssigned={() => {
            onOrderUpdated();
          }}
        />
      )}
    </>
  );
};
