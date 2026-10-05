import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../common/Button.js';
import { useToast } from '../../store/toastStore.js';

interface ExportCSVButtonProps {
  search?: string;
  status?: string;
  storeId?: string;
  startDate?: string;
  endDate?: string;
}

export const ExportCSVButton: React.FC<ExportCSVButtonProps> = ({
  search,
  status,
  storeId,
  startDate,
  endDate,
}) => {
  const [exporting, setExporting] = useState(false);
  const { addToast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (storeId && storeId !== 'all') params.append('storeId', storeId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/orders/export/csv?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể xuất file CSV');
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `fastfood-orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      addToast('Xuất dữ liệu đơn hàng CSV thành công!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi xuất CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      isLoading={exporting}
      leftIcon={<Download className="w-4 h-4" />}
    >
      Xuất CSV
    </Button>
  );
};
