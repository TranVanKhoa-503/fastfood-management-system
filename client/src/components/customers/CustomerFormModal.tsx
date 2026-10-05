import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { ICustomer } from '../../types/index.js';
import api from '../../lib/axios.js';
import { useToast } from '../../store/toastStore.js';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: ICustomer | null;
  onSaved: () => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const isEditing = !!customer;

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setAddress(customer.address);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address) {
      addToast('Vui lòng điền đầy đủ các trường thông tin', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/customers/${customer._id}`, { name, email, phone, address });
        addToast('Cập nhật khách hàng thành công!', 'success');
      } else {
        await api.post('/customers', { name, email, phone, address });
        addToast('Thêm mới khách hàng thành công!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi lưu thông tin khách hàng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa thông tin Khách hàng' : 'Thêm mới Khách hàng'}
      subtitle="Quản lý dữ liệu hồ sơ và thông tin nhận hàng"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Họ và tên *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
          required
        />

        <Input
          label="Địa chỉ Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
          required
        />

        <Input
          label="Số điện thoại *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0912345678"
          required
        />

        <Input
          label="Địa chỉ giao hàng mặc định *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            {isEditing ? 'Lưu thay đổi' : 'Thêm khách hàng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
