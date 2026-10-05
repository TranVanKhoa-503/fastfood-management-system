import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { ICustomer, IStore, IMenuItem } from '../../types/index.js';
import api from '../../lib/axios.js';
import { formatCurrency } from '../../lib/formatters.js';
import { Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { useToast } from '../../store/toastStore.js';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface SelectedItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'momo' | 'vnpay'>('cash');
  const [note, setNote] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(15000);

  const [orderItems, setOrderItems] = useState<SelectedItem[]>([]);
  const [selectedMenuToAdd, setSelectedMenuToAdd] = useState('');

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedStoreId('');
    setDeliveryAddress('');
    setPaymentMethod('cash');
    setNote('');
    setDeliveryFee(15000);
    setOrderItems([]);
    setSelectedMenuToAdd('');
  };

  const loadDependencies = async () => {
    setLoadingInitial(true);
    try {
      const [custRes, storeRes, menuRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/stores'),
        api.get('/menu'),
      ]);

      if (custRes.data.success) {
        setCustomers(custRes.data.data.customers);
        if (custRes.data.data.customers.length > 0) {
          const first = custRes.data.data.customers[0];
          setSelectedCustomerId(first._id);
          setDeliveryAddress(first.address);
        }
      }

      if (storeRes.data.success) {
        setStores(storeRes.data.data);
        if (storeRes.data.data.length > 0) {
          setSelectedStoreId(storeRes.data.data[0]._id);
        }
      }

      if (menuRes.data.success) {
        setMenuItems(menuRes.data.data);
        if (menuRes.data.data.length > 0) {
          setSelectedMenuToAdd(menuRes.data.data[0]._id);
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải dữ liệu khởi tạo đơn hàng', 'error');
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c._id === custId);
    if (found && found.address) {
      setDeliveryAddress(found.address);
    }
  };

  const handleAddItem = () => {
    if (!selectedMenuToAdd) return;
    const item = menuItems.find((m) => m._id === selectedMenuToAdd);
    if (!item) return;

    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          qty: 1,
        },
      ];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.menuItemId === itemId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedItem[]
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((i) => i.menuItemId !== itemId));
  };

  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalAmount = subtotal + Number(deliveryFee || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedStoreId || orderItems.length === 0 || !deliveryAddress) {
      addToast('Vui lòng điền đầy đủ thông tin và thêm ít nhất một món', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        storeId: selectedStoreId,
        items: orderItems,
        deliveryFee: Number(deliveryFee),
        paymentMethod,
        deliveryAddress,
        note,
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        addToast('Tạo đơn hàng mới thành công!', 'success');
        onCreated();
        onClose();
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tạo đơn hàng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Đơn Hàng Mới"
      subtitle="Nhập thông tin khách hàng, chi nhánh & chọn danh sách món ăn"
      maxWidth="2xl"
    >
      {loadingInitial ? (
        <div className="py-12 text-center text-sm text-slate-400">Đang tải biểu mẫu...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer & Store Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Khách hàng *"
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              options={customers.map((c) => ({
                value: c._id,
                label: `${c.name} (${c.phone})`,
              }))}
            />

            <Select
              label="Cửa hàng phục vụ *"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              options={stores.map((s) => ({
                value: s._id,
                label: `${s.name} - ${s.status === 'open' ? 'Mở cửa' : 'Đóng'}`,
              }))}
            />
          </div>

          {/* Items Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Chọn món vào đơn hàng *
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedMenuToAdd}
                onChange={(e) => setSelectedMenuToAdd(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {menuItems.map((item) => (
                  <option key={item._id} value={item._id}>
                    [{item.category}] {item.name} - {formatCurrency(item.price)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddItem}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Thêm
              </Button>
            </div>

            {/* Selected Items Table */}
            {orderItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                <span>Chưa có món nào được chọn. Hãy bấm nút "Thêm" ở trên.</span>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {orderItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Qty controls */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItemId, -1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-900 dark:text-white">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItemId, 1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="w-24 text-right font-bold text-slate-900 dark:text-white text-xs">
                        {formatCurrency(item.price * item.qty)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.menuItemId)}
                        className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Details */}
          <div className="space-y-3">
            <Input
              label="Địa chỉ giao hàng *"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Số nhà, tên đường, phường, quận..."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Phương thức thanh toán"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                options={[
                  { value: 'cash', label: 'Tiền mặt khi nhận hàng (COD)' },
                  { value: 'card', label: 'Thẻ ATM / Tín dụng' },
                  { value: 'momo', label: 'Ví điện tử MoMo' },
                  { value: 'vnpay', label: 'Cổng VNPAY' },
                ]}
              />

              <Input
                label="Phí giao hàng (VND)"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                min="0"
                step="1000"
              />
            </div>

            <Input
              label="Ghi chú đơn hàng"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Không lấy đá, tương ớt thêm..."
            />
          </div>

          {/* Calculation Summary Box */}
          <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tạm tính ({orderItems.reduce((acc, i) => acc + i.qty, 0)} món):</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-orange-600 dark:text-orange-400 pt-2 border-t border-orange-200/50 dark:border-orange-800/40">
              <span>Tổng thanh toán:</span>
              <span className="text-base">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={orderItems.length === 0 || !deliveryAddress}
            >
              Tạo Đơn Hàng Ngay
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
