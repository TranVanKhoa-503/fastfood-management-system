import React from 'react';
import { IMenuItem } from '../../types/index.js';
import { formatCurrency } from '../../lib/formatters.js';
import { Utensils, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.js';

interface MenuListProps {
  items: IMenuItem[];
  loading: boolean;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onEdit: (item: IMenuItem) => void;
  onDelete: (item: IMenuItem) => void;
  onToggleAvailable: (item: IMenuItem) => void;
  onCreateNew: () => void;
}

const CATEGORIES = ['all', 'Burgers', 'Pizzas', 'Drinks', 'Sides', 'Desserts', 'Combos'];

export const MenuList: React.FC<MenuListProps> = ({
  items,
  loading,
  selectedCategory,
  onSelectCategory,
  onEdit,
  onDelete,
  onToggleAvailable,
  onCreateNew,
}) => {
  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto shadow-sm">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat === 'all' ? 'Tất cả danh mục' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa có món ăn nào"
          description="Chưa có món ăn nào trong danh mục này."
          icon={<Utensils className="w-8 h-8" />}
          actionText="Thêm món mới"
          onAction={onCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image & Category badge */}
                <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={
                      item.image ||
                      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'
                    }
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isAvailable
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.isAvailable ? 'Đang bán' : 'Hết hàng'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                    {item.description || 'Hương vị thơm ngon, chế biến tươi mới mỗi ngày.'}
                  </p>
                  <p className="text-base font-black text-orange-600 dark:text-orange-400 pt-1">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onToggleAvailable(item)}
                  className={`text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    item.isAvailable
                      ? 'text-emerald-600 dark:text-emerald-400 hover:text-rose-600'
                      : 'text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  {item.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Có sẵn</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tắt bán</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
