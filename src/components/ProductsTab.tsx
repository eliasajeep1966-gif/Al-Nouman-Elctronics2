"use client";

import { useState, useMemo } from 'react';
import { Product, ProductCategory } from '@/lib/types';
import { USD_TO_SYP } from '@/lib/useStore';
import ProductCard from './ProductCard';
import AddProductModal from './AddProductModal';

interface ProductsTabProps {
  products: Product[];
  category: ProductCategory;
  onAdd: (name: string, quantity: number, originalPrice: number, sellingPrice: number, originalPriceUSD?: number, sellingPriceUSD?: number) => void;
  onSell: (id: string) => void;
  onDelete: (id: string) => void;
  onLoss: (id: string, amount: number) => void;
}

export default function ProductsTab({ products, category, onAdd, onSell, onDelete, onLoss }: ProductsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [showBalance, setShowBalance] = useState(false);

  const categoryLabel = category === 'parts' ? 'قطع الغيار' : 'الأدوات الإلكترونية';
  const categoryIcon = category === 'parts' ? '⚙️' : '🖥️';

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const totalValue = products.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalCost = products.reduce((sum, p) => sum + p.originalPrice * p.quantity, 0);
  const totalProfit = products.reduce((sum, p) => sum + (p.sellingPrice - p.originalPrice) * p.quantity, 0);
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);

  // الرصيد = مجموع المصاريف (التكلفة الكلية)
  const totalBalance = totalCost;
  const totalBalanceUSD = totalBalance / USD_TO_SYP;

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">إجمالي المنتجات</p>
          <p className="text-xl font-bold text-gray-800">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">إجمالي القطع</p>
          <p className="text-xl font-bold text-blue-600">{totalItems}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">الربح المتوقع</p>
          <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(totalProfit / USD_TO_SYP).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      {showBalance && (
        <div className="mb-4 bg-gradient-to-l from-purple-600 to-purple-700 text-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">💰 الرصيد (مجموع المصاريف)</h3>
            <button
              onClick={() => setShowBalance(false)}
              className="text-white/70 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <p className="text-xs text-purple-100 mb-1">بالدولار</p>
              <p className="font-bold text-xl">${totalBalanceUSD.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <p className="text-xs text-purple-100 mb-1">بالليرة السورية</p>
              <p className="font-bold text-xl">{totalBalance.toLocaleString()}</p>
              <p className="text-xs text-purple-200">ل.س</p>
            </div>
          </div>
          <div className="mt-2 bg-white/10 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-100">إجمالي قيمة المخزون بسعر البيع</p>
            <p className="font-bold">${(totalValue / USD_TO_SYP).toFixed(2)} = {totalValue.toLocaleString()} ل.س</p>
          </div>
        </div>
      )}

      {/* Search + Add + Balance */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`البحث في ${categoryLabel}...`}
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap ${
            showBalance
              ? 'bg-purple-600 text-white'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
          }`}
        >
          💰 الرصيد
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap flex items-center gap-1.5"
        >
          <span className="text-base">+</span>
          إضافة
        </button>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">{search ? '🔍' : categoryIcon}</div>
            <p className="text-gray-500 font-medium text-lg">
              {search ? 'لا توجد نتائج للبحث' : `لا توجد ${categoryLabel} بعد`}
            </p>
            {!search && (
              <p className="text-gray-400 text-sm mt-1">
                اضغط على زر &quot;إضافة&quot; لإضافة منتج جديد
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSell={onSell}
                onDelete={onDelete}
                onLoss={onLoss}
              />
            ))}
          </div>
        )}
      </div>

      {/* Total Value Footer */}
      {products.length > 0 && (
        <div className="mt-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white rounded-xl p-3 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium opacity-90">إجمالي قيمة المخزون</span>
          <div className="text-right">
            <span className="font-bold text-lg">${(totalValue / USD_TO_SYP).toFixed(2)}</span>
            <span className="text-xs text-blue-200 block">{totalValue.toLocaleString()} ل.س</span>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddProductModal
          category={category}
          onAdd={onAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
