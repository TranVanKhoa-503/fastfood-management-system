import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { ICustomer, IOrder } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../lib/formatters.js';
import api from '../../lib/axios.js';
import { User, Phone, Mail, MapPin, ShoppingBag, DollarSign, Calendar } from 'lucide-react';

interface CustomerDetailModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  isOpen,
  onClose,
}) => {
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await api.get(`/customers/${customerId}`);
      if (res.data.success) {
        setCustomer(res.data.data.customer);
        setOrders(res.data.data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hồ sơ & Lịch sử Khách hàng"
      subtitle={customer ? customer.name : 'Đang tải...'}
      maxWidth="3xl"
    >
      {loading || !customer ? (
        <div className="py-12 text-center text-sm text-slate-400">Đang tải hồ sơ...</div>
      ) : (
        <div className="space-y-6">
          {/* Profile Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-bold uppercase">
                <User className="w-4 h-4 text-orange-600" />
                <span>Thông tin cá nhân</span>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">{customer.name}</p>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="w-3.5 h-3.5" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>{customer.address}</span>
              </div>
            </div>

            {/* Spend & Order Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40 flex flex-col justify-between">
                <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 w-fit">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Tổng chi tiêu
                  </p>
                  <p className="text-base font-extrabold text-orange-600 dark:text-orange-400 mt-0.5">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 flex flex-col justify-between">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 w-fit">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Tổng số đơn
                  </p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    {customer.orderCount} đơn hàng
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Lịch sử đặt hàng ({orders.length})
            </h4>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                Khách hàng này chưa có đơn hàng nào trong hệ thống.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Mã đơn</th>
                      <th className="px-3.5 py-2.5">Cửa hàng</th>
                      <th className="px-3.5 py-2.5">Số món</th>
                      <th className="px-3.5 py-2.5 text-right">Tổng tiền</th>
                      <th className="px-3.5 py-2.5 text-center">Trạng thái</th>
                      <th className="px-3.5 py-2.5">Ngày đặt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {orders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-orange-600 dark:text-orange-400">
                          #{ord._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-3.5 py-2.5">{ord.storeId?.name || '-'}</td>
                        <td className="px-3.5 py-2.5">
                          {ord.items.reduce((acc, it) => acc + it.qty, 0)} món
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <Badge status={ord.status} />
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-400">{formatDate(ord.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
