import React, { useState, useEffect, useCallback } from 'react';
import { ICustomer, IPagination } from '../types/index.js';
import { CustomerList } from '../components/customers/CustomerList.js';
import { CustomerFormModal } from '../components/customers/CustomerFormModal.js';
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal.js';
import { Button } from '../components/common/Button.js';
import { Pagination } from '../components/common/Pagination.js';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce.js';
import api from '../lib/axios.js';
import { useToast } from '../store/toastStore.js';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);
  const { addToast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: {
          search: debouncedSearch,
          page,
          limit: 10,
        },
      });

      if (res.data.success) {
        setCustomers(res.data.data.customers);
        setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải danh sách khách hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDeleteCustomer = async (cust: ICustomer) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${cust.name}"?`)) return;

    try {
      await api.delete(`/customers/${cust._id}`);
      addToast('Xóa khách hàng thành công!', 'success');
      fetchCustomers();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi xóa khách hàng', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Quản lý Khách hàng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hồ sơ khách hàng, địa chỉ giao nhận, lịch sử đặt hàng và tổng chi tiêu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCustomer(null);
              setFormModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Thêm khách hàng
          </Button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên, email, số điện thoại hoặc địa chỉ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* List */}
      <CustomerList
        customers={customers}
        loading={loading}
        onView={(cust) => setViewCustomerId(cust._id)}
        onEdit={(cust) => {
          setEditingCustomer(cust);
          setFormModalOpen(true);
        }}
        onDelete={handleDeleteCustomer}
        onCreateNew={() => {
          setEditingCustomer(null);
          setFormModalOpen(true);
        }}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(p) => setPage(p)}
      />

      {/* Form Modal (Create / Edit) */}
      {formModalOpen && (
        <CustomerFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          customer={editingCustomer}
          onSaved={fetchCustomers}
        />
      )}

      {/* Detail Modal */}
      {viewCustomerId && (
        <CustomerDetailModal
          isOpen={!!viewCustomerId}
          customerId={viewCustomerId}
          onClose={() => setViewCustomerId(null)}
        />
      )}
    </div>
  );
};
