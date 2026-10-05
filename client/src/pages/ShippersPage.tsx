import React, { useState, useEffect } from 'react';
import { IShipper, IStore } from '../types/index.js';
import { ShipperList } from '../components/shippers/ShipperList.js';
import { ShipperModal } from '../components/shippers/ShipperModal.js';
import { Button } from '../components/common/Button.js';
import { Plus, RefreshCw, Search, Filter } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce.js';
import api from '../lib/axios.js';
import { useToast } from '../store/toastStore.js';

export const ShippersPage: React.FC = () => {
  const [shippers, setShippers] = useState<IShipper[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [storeId, setStoreId] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingShipper, setEditingShipper] = useState<IShipper | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { addToast } = useToast();

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      if (res.data.success) {
        setStores(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShippers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (status !== 'all') params.status = status;
      if (storeId !== 'all') params.storeId = storeId;

      const res = await api.get('/shippers', { params });
      if (res.data.success) {
        setShippers(res.data.data);
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải danh sách tài xế', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchShippers();
  }, [debouncedSearch, status, storeId]);

  const handleDeleteShipper = async (shp: IShipper) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài xế "${shp.fullName}"?`)) return;

    try {
      await api.delete(`/shippers/${shp._id}`);
      addToast('Xóa tài xế thành công!', 'success');
      fetchShippers();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi xóa tài xế', 'error');
    }
  };

  const handleToggleStatus = async (
    shp: IShipper,
    nextStatus: 'available' | 'busy' | 'offline'
  ) => {
    try {
      await api.put(`/shippers/${shp._id}`, { status: nextStatus });
      addToast(`Đã chuyển trạng thái tài xế sang "${nextStatus}"`, 'success');
      fetchShippers();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi cập nhật trạng thái tài xế', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Đội ngũ Tài xế Giao hàng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản lý tài xế, phương tiện di chuyển, chi nhánh trực thuộc và theo dõi số đơn đang giao
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShippers}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingShipper(null);
              setModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Thêm tài xế
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tài xế, số điện thoại, biển số xe..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Store select */}
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả chi nhánh</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status buttons */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'available', label: 'Sẵn sàng' },
              { id: 'busy', label: 'Bận' },
              { id: 'offline', label: 'Offline' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatus(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  status === st.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <ShipperList
        shippers={shippers}
        loading={loading}
        onEdit={(shp) => {
          setEditingShipper(shp);
          setModalOpen(true);
        }}
        onDelete={handleDeleteShipper}
        onCreateNew={() => {
          setEditingShipper(null);
          setModalOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modal */}
      {modalOpen && (
        <ShipperModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shipper={editingShipper}
          stores={stores}
          onSaved={fetchShippers}
        />
      )}
    </div>
  );
};
