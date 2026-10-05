import React, { useState, useEffect, useCallback } from 'react';
import { IOrder, IStore, IPagination } from '../types/index.js';
import { OrderList } from '../components/orders/OrderList.js';
import { OrderFilterBar } from '../components/orders/OrderFilterBar.js';
import { ExportCSVButton } from '../components/orders/ExportCSVButton.js';
import { CreateOrderModal } from '../components/orders/CreateOrderModal.js';
import { Button } from '../components/common/Button.js';
import { Pagination } from '../components/common/Pagination.js';
import { Plus, RefreshCw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce.js';
import api from '../lib/axios.js';
import { useToast } from '../store/toastStore.js';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [storeId, setStoreId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (status !== 'all') params.status = status;
      if (storeId !== 'all') params.storeId = storeId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/orders', { params });
      if (res.data.success) {
        setOrders(res.data.data.orders);
        setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status, storeId, startDate, endDate, addToast]);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setStoreId('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Danh sách Đơn hàng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tìm kiếm, lọc theo trạng thái/chi nhánh, xử lý đơn và xuất dữ liệu báo cáo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>

          <ExportCSVButton
            search={debouncedSearch}
            status={status}
            storeId={storeId}
            startDate={startDate}
            endDate={endDate}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tạo đơn mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <OrderFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        storeId={storeId}
        onStoreChange={(val) => {
          setStoreId(val);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(1);
        }}
        stores={stores}
        onReset={handleResetFilters}
      />

      {/* Orders Table */}
      <OrderList
        orders={orders}
        loading={loading}
        onRefresh={fetchOrders}
        onCreateNew={() => setCreateModalOpen(true)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(p) => setPage(p)}
      />

      {/* Create Order Modal */}
      {createModalOpen && (
        <CreateOrderModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};
