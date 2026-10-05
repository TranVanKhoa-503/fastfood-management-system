import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { IMenuItem } from '../../types/index.js';
import api from '../../lib/axios.js';
import { useToast } from '../../store/toastStore.js';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem?: IMenuItem | null;
  onSaved: () => void;
}

const CATEGORIES = ['Burgers', 'Pizzas', 'Drinks', 'Sides', 'Desserts', 'Combos'];

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  menuItem,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Burgers');
  const [price, setPrice] = useState(50000);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const isEditing = !!menuItem;

  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name);
      setCategory(menuItem.category);
      setPrice(menuItem.price);
      setDescription(menuItem.description || '');
      setImage(menuItem.image || '');
      setIsAvailable(menuItem.isAvailable !== undefined ? menuItem.isAvailable : true);
    } else {
      setName('');
      setCategory('Burgers');
      setPrice(50000);
      setDescription('');
      setImage('');
      setIsAvailable(true);
    }
  }, [menuItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || price === undefined) {
      addToast('Vui lòng điền tên, danh mục và giá món ăn', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        category,
        price: Number(price),
        description,
        image:
          image ||
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isAvailable,
      };

      if (isEditing) {
        await api.put(`/menu/${menuItem._id}`, payload);
        addToast('Cập nhật món ăn thành công!', 'success');
      } else {
        await api.post('/menu', payload);
        addToast('Thêm món ăn mới vào thực đơn thành công!', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi lưu món ăn', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa Món ăn' : 'Thêm Món mới vào Thực đơn'}
      subtitle="Quản lý giá, danh mục, hình ảnh và trạng thái bán"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên món ăn / Combo *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Double Cheeseburger Supreme"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Danh mục món *"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />

          <Input
            label="Đơn giá (VND) *"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min="0"
            step="1000"
            required
          />
        </div>

        <Input
          label="URL Hình ảnh món ăn"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://images.unsplash.com/..."
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mô tả món ăn
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Thịt bò Úc nướng, phô mai Cheddar, sốt đặc biệt..."
            rows={3}
            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isAvailable"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
          />
          <label
            htmlFor="isAvailable"
            className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            Đang mở bán (Khách có thể đặt món này)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            {isEditing ? 'Lưu thay đổi' : 'Thêm món ăn'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
