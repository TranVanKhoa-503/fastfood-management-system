import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { IShipper } from '../../types/index.js';
import api from '../../lib/axios.js';
import { Bike, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../store/toastStore.js';

interface AssignShipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  storeId?: string;
  currentShipperId?: string | null;
  onAssigned: () => void;
}

export const AssignShipperModal: React.FC<AssignShipperModalProps> = ({
  isOpen,
  onClose,
  orderId,
  storeId,
  currentShipperId,
  onAssigned,
}) => {
  const [shippers, setShippers] = useState<IShipper[]>([]);
  const [selectedShipperId, setSelectedShipperId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedShipperId(currentShipperId || '');
      fetchShippers();
    }
  }, [isOpen, storeId, currentShipperId]);

  const fetchShippers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shippers', {
        params: storeId ? { storeId } : {},
      });
      if (res.data.success) {
        setShippers(res.data.data);
      }
    } catch (err: any) {
      addToast(err.message || 'Không tải được danh sách tài xế', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedShipperId) {
      addToast('Vui lòng chọn một tài xế', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.patch(`/orders/${orderId}/assign-shipper`, {
        shipperId: selectedShipperId,
      });

      if (res.data.success) {
        addToast('Gán tài xế thành công! Trạng thái tài xế đã đổi sang Bận.', 'success');
        onAssigned();
        onClose();
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi gán tài xế', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gán Tài xế Giao hàng"
      subtitle={`Đơn hàng: #${orderId.slice(-6)}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Khi gán tài xế cho đơn hàng, tài xế sẽ tự động chuyển sang trạng thái <b>Đang bận (Busy)</b>.
        </p>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách tài xế...</div>
        ) : shippers.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
            Không có tài xế nào khả dụng tại chi nhánh này. Vui lòng thêm tài xế trong mục Tài xế.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {shippers.map((shipper) => {
              const isSelected = selectedShipperId === shipper._id;
              const isCurrent = currentShipperId === shipper._id;

              return (
                <div
                  key={shipper._id}
                  onClick={() => setSelectedShipperId(shipper._id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 ring-1 ring-orange-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {shipper.fullName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {shipper.phone} • {shipper.licensePlate} ({shipper.vehicle})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        shipper.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {shipper.status === 'available' ? 'Sẵn sàng' : 'Đang bận'}
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-orange-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            isLoading={submitting}
            disabled={!selectedShipperId || loading}
          >
            Xác nhận gán
          </Button>
        </div>
      </div>
    </Modal>
  );
};
