import React, { useState, useEffect } from 'react';
import { IStore } from '../types/index.js';
import { StoreList } from '../components/stores/StoreList.js';
import { StoreModal } from '../components/stores/StoreModal.js';
import { Button } from '../components/common/Button.js';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce.js';
import api from '../lib/axios.js';
import { useToast } from '../store/toastStore.js';

export const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<IStore | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { addToast } = useToast();

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stores', {
        params: {
          search: debouncedSearch,
          status: status !== 'all' ? status : undefined,
        },
      });

      if (res.data.success) {
        setStores(res.data.data);
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải danh sách chi nhánh', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [debouncedSearch, status]);

  const handleDeleteStore = async (store: IStore) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chi nhánh "${store.name}"?`)) return;

    try {
      await api.delete(`/stores/${store._id}`);
      addToast('Xóa chi nhánh thành công!', 'success');
      fetchStores();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi xóa chi nhánh', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Hệ thống Chi nhánh Cửa hàng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản lý địa chỉ, tọa độ GeoJSON 2dsphere, giờ mở cửa và doanh thu từng chi nhánh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStores}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingStore(null);
              setModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Thêm chi nhánh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên chi nhánh, địa chỉ hoặc số điện thoại..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['all', 'open', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === st
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'all' ? 'Tất cả' : st === 'open' ? '🟢 Mở cửa' : '🔴 Đóng cửa'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <StoreList
        stores={stores}
        loading={loading}
        onEdit={(st) => {
          setEditingStore(st);
          setModalOpen(true);
        }}
        onDelete={handleDeleteStore}
        onCreateNew={() => {
          setEditingStore(null);
          setModalOpen(true);
        }}
      />

      {/* Modal */}
      {modalOpen && (
        <StoreModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          store={editingStore}
          onSaved={fetchStores}
        />
      )}
    </div>
  );
};
