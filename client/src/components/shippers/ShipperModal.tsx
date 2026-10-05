import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { IShipper, IStore } from '../../types/index.js';
import api from '../../lib/axios.js';
import { useToast } from '../../store/toastStore.js';

interface ShipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipper?: IShipper | null;
  stores: IStore[];
  onSaved: () => void;
}

export const ShipperModal: React.FC<ShipperModalProps> = ({
  isOpen,
  onClose,
  shipper,
  stores,
  onSaved,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('Honda Wave Alpha');
  const [licensePlate, setLicensePlate] = useState('');
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [storeId, setStoreId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const isEditing = !!shipper;

  useEffect(() => {
    if (shipper) {
      setFullName(shipper.fullName);
      setPhone(shipper.phone);
      setVehicle(shipper.vehicle || 'Motorbike');
      setLicensePlate(shipper.licensePlate);
      setStatus(shipper.status || 'available');
      setStoreId(
        typeof shipper.storeId === 'object' && shipper.storeId?._id
          ? shipper.storeId._id
          : (shipper.storeId as string) || (stores[0]?._id ?? '')
      );
    } else {
      setFullName('');
      setPhone('');
      setVehicle('Honda Wave Alpha');
      setLicensePlate('');
      setStatus('available');
      setStoreId(stores[0]?._id ?? '');
    }
  }, [shipper, stores, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !licensePlate || !storeId) {
      addToast('Vui lòng điền đầy đủ các thông tin của tài xế', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName,
        phone,
        vehicle,
        licensePlate,
        status,
        storeId,
      };

      if (isEditing) {
        await api.put(`/shippers/${shipper._id}`, payload);
        addToast('Cập nhật thông tin tài xế thành công!', 'success');
      } else {
        await api.post('/shippers', payload);
        addToast('Thêm mới tài xế giao hàng thành công!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi lưu thông tin tài xế', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa Hồ sơ Tài xế' : 'Thêm mới Tài xế Giao hàng'}
      subtitle="Quản lý thông tin phương tiện, biển số & chi nhánh trực thuộc"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Họ và tên tài xế *"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyễn Thành Đạt"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Số điện thoại *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0981112233"
            required
          />

          <Select
            label="Trạng thái *"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'available', label: '🟢 Sẵn sàng nhận đơn' },
              { value: 'busy', label: '🟡 Đang giao hàng (Busy)' },
              { value: 'offline', label: '⚪ Ngoại tuyến (Offline)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Loại xe / Phương tiện *"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="Honda Wave / Air Blade"
            required
          />

          <Input
            label="Biển kiểm soát xe *"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            placeholder="29-B1 567.89"
            required
          />
        </div>

        <Select
          label="Cửa hàng / Chi nhánh trực thuộc *"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          options={stores.map((s) => ({
            value: s._id,
            label: s.name,
          }))}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            {isEditing ? 'Lưu cập nhật' : 'Thêm tài xế'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
