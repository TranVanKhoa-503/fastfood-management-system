import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { IStore } from '../../types/index.js';
import api from '../../lib/axios.js';
import { useToast } from '../../store/toastStore.js';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store?: IStore | null;
  onSaved: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  store,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [lng, setLng] = useState('105.8542');
  const [lat, setLat] = useState('21.0285');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const isEditing = !!store;

  useEffect(() => {
    if (store) {
      setName(store.name);
      setAddress(store.address);
      setPhone(store.phone);
      setLng(store.location?.coordinates?.[0]?.toString() || '105.8542');
      setLat(store.location?.coordinates?.[1]?.toString() || '21.0285');
      setOpenTime(store.openHours?.open || '08:00');
      setCloseTime(store.openHours?.close || '22:00');
      setStatus(store.status || 'open');
    } else {
      setName('');
      setAddress('');
      setPhone('');
      setLng('105.8542');
      setLat('21.0285');
      setOpenTime('08:00');
      setCloseTime('22:00');
      setStatus('open');
    }
  }, [store, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone) {
      addToast('Vui lòng điền tên, địa chỉ và số điện thoại chi nhánh', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        address,
        phone,
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) || 105.8542, parseFloat(lat) || 21.0285],
        },
        openHours: {
          open: openTime,
          close: closeTime,
        },
        status,
      };

      if (isEditing) {
        await api.put(`/stores/${store._id}`, payload);
        addToast('Cập nhật thông tin chi nhánh thành công!', 'success');
      } else {
        await api.post('/stores', payload);
        addToast('Tạo chi nhánh cửa hàng mới thành công!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi lưu thông tin chi nhánh', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa Chi nhánh Cửa hàng' : 'Thêm Chi nhánh Mới'}
      subtitle="Quản lý thông tin vị trí GeoJSON (2dsphere), giờ mở cửa và trạng thái"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên chi nhánh *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="FastFood Hoàn Kiếm - Flagship"
          required
        />

        <Input
          label="Địa chỉ chi nhánh *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="25 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Số điện thoại bàn / hotline *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024-3825-1101"
            required
          />

          <Select
            label="Trạng thái hoạt động *"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
            options={[
              { value: 'open', label: '🟢 Đang mở cửa phục vụ (Open)' },
              { value: 'closed', label: '🔴 Tạm đóng cửa (Closed)' },
            ]}
          />
        </div>

        {/* GeoJSON Coordinates */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Tọa độ vị trí GeoJSON Point (2dsphere Index)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kinh độ (Longitude)"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="105.8542"
              required
            />
            <Input
              label="Vĩ độ (Latitude)"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="21.0285"
              required
            />
          </div>
        </div>

        {/* Open hours */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Giờ mở cửa"
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
          />
          <Input
            label="Giờ đóng cửa"
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            {isEditing ? 'Lưu cập nhật' : 'Tạo chi nhánh'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
