import React, { useState, useEffect, useCallback } from 'react';
import { IMenuItem } from '../types/index.js';
import { MenuList } from '../components/menu/MenuList.js';
import { MenuModal } from '../components/menu/MenuModal.js';
import { Button } from '../components/common/Button.js';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce.js';
import api from '../lib/axios.js';
import { useToast } from '../store/toastStore.js';

export const MenuPage: React.FC = () => {
  const [items, setItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { addToast } = useToast();

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (category !== 'all') params.category = category;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get('/menu', { params });
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải thực đơn', 'error');
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, addToast]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleDeleteItem = async (item: IMenuItem) => {
    if (!window.confirm(`Bạn có chắc muốn xóa món "${item.name}" khỏi thực đơn?`)) return;

    try {
      await api.delete(`/menu/${item._id}`);
      addToast('Xóa món ăn thành công!', 'success');
      fetchMenuItems();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi xóa món ăn', 'error');
    }
  };

  const handleToggleAvailable = async (item: IMenuItem) => {
    try {
      await api.put(`/menu/${item._id}`, {
        isAvailable: !item.isAvailable,
      });
      addToast(
        `Đã ${!item.isAvailable ? 'mở bán' : 'tắt bán'} món "${item.name}"`,
        'success'
      );
      fetchMenuItems();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi cập nhật trạng thái món', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Thực đơn & Danh mục Món ăn
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản lý món ăn, burger, pizza, thức uống, combo tiệc và trạng thái mở bán
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMenuItems}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Thêm món mới
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên món hoặc mô tả..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Menu List */}
      <MenuList
        items={items}
        loading={loading}
        selectedCategory={category}
        onSelectCategory={(cat) => setCategory(cat)}
        onEdit={(it) => {
          setEditingItem(it);
          setModalOpen(true);
        }}
        onDelete={handleDeleteItem}
        onToggleAvailable={handleToggleAvailable}
        onCreateNew={() => {
          setEditingItem(null);
          setModalOpen(true);
        }}
      />

      {/* Form Modal */}
      {modalOpen && (
        <MenuModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          menuItem={editingItem}
          onSaved={fetchMenuItems}
        />
      )}
    </div>
  );
};
