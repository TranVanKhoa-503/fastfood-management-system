import React from 'react';
import { IReview } from '../../types/index.js';
import { formatDate } from '../../lib/formatters.js';
import { RatingStars } from './RatingStars.js';
import { Star, Store, User, MessageSquare, Trash2 } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.js';

interface ReviewListProps {
  reviews: IReview[];
  storeAverages: Array<{ storeId: string; storeName: string; avgRating: number; totalReviews: number }>;
  loading: boolean;
  selectedRating: string;
  onSelectRating: (val: string) => void;
  selectedStore: string;
  onSelectStore: (val: string) => void;
  onDeleteReview: (id: string) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  storeAverages,
  loading,
  selectedRating,
  onSelectRating,
  selectedStore,
  onSelectStore,
  onDeleteReview,
}) => {
  return (
    <div className="space-y-6">
      {/* Store Average Ratings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeAverages.map((st) => (
          <div
            key={st.storeId}
            onClick={() => onSelectStore(selectedStore === st.storeId ? 'all' : st.storeId)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedStore === st.storeId
                ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-500 ring-1 ring-orange-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                <Store className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="truncate">{st.storeName}</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-lg text-xs font-black text-amber-700 dark:text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{st.avgRating || 5.0}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Dựa trên {st.totalReviews} lượt đánh giá từ khách
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs by Star */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { value: 'all', label: 'Tất cả sao' },
            { value: '5', label: '5 ⭐ Tuyệt vời' },
            { value: '4', label: '4 ⭐ Rất tốt' },
            { value: '3', label: '3 ⭐ Bình thường' },
            { value: '2', label: '2 ⭐ Chưa hài lòng' },
            { value: '1', label: '1 ⭐ Kém' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => onSelectRating(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedRating === tab.value
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedStore !== 'all' && (
          <button
            onClick={() => onSelectStore('all')}
            className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline cursor-pointer"
          >
            Bỏ lọc chi nhánh
          </button>
        )}
      </div>

      {/* Review items */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="Không có đánh giá nào"
          description="Chưa có đánh giá nào khớp với tiêu chí lọc."
          icon={<MessageSquare className="w-8 h-8" />}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-xs">
                      {rev.customerId?.name?.slice(0, 1) || 'K'}
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {rev.customerId?.name || 'Khách vãng lai'}
                    </span>
                  </div>

                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <RatingStars rating={rev.rating} size="sm" />
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-400">{formatDate(rev.createdAt)}</span>
                </div>

                {/* Comment content */}
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  "{rev.comment}"
                </p>

                {/* Store & Order info badge */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                    <Store className="w-3 h-3" />
                    {rev.storeId?.name}
                  </span>
                  {rev.orderId?._id && (
                    <span>• Đơn hàng #{rev.orderId._id.slice(-6).toUpperCase()}</span>
                  )}
                </div>
              </div>

              {/* Action delete */}
              <button
                onClick={() => onDeleteReview(rev._id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Xóa đánh giá này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
