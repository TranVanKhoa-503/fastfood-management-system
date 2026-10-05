import React, { useState, useEffect, useCallback } from 'react';
import { IReview } from '../types/index.js';
import { ReviewList } from '../components/reviews/ReviewList.js';
import { Button } from '../components/common/Button.js';
import { RefreshCw } from 'lucide-react';
import api from '../lib/axios.js';
import { useToast } from '../store/toastStore.js';

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [storeAverages, setStoreAverages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState('all');
  const [storeId, setStoreId] = useState('all');
  const { addToast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (rating !== 'all') params.rating = rating;
      if (storeId !== 'all') params.storeId = storeId;

      const res = await api.get('/reviews', { params });
      if (res.data.success) {
        setReviews(res.data.data.reviews);
        setStoreAverages(res.data.data.storeAverages);
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải danh sách đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  }, [rating, storeId, addToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;

    try {
      await api.delete(`/reviews/${id}`);
      addToast('Xóa đánh giá thành công!', 'success');
      fetchReviews();
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi xóa đánh giá', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Đánh giá & Phản hồi Khách hàng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lọc theo số sao (1-5 ⭐), theo dõi điểm trung bình từng chi nhánh và phản hồi từ khách
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviews}
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Làm mới
        </Button>
      </div>

      {/* Review List & Scorecards */}
      <ReviewList
        reviews={reviews}
        storeAverages={storeAverages}
        loading={loading}
        selectedRating={rating}
        onSelectRating={(r) => setRating(r)}
        selectedStore={storeId}
        onSelectStore={(s) => setStoreId(s)}
        onDeleteReview={handleDeleteReview}
      />
    </div>
  );
};
