"use client";

import { useState, useMemo } from 'react';
import { Product, ProductCategory } from '@/lib/types';
import ProductCard from './ProductCard';
import AddProductModal from './AddProductModal';

interface ProductsTabProps {
  products: Product[];
  category: ProductCategory;
  exchangeRate: number;
  onAdd: (name: string, quantity: number, originalPrice: number, sellingPrice: number, originalPriceUSD?: number, sellingPriceUSD?: number, specifications?: string) => void;
  onSell: (id: string) => void;
  onDelete: (id: string) => void;
  onLoss: (id: string) => void;
}

export default function ProductsTab({ products, category, exchangeRate, onAdd, onSell, onDelete, onLoss }: ProductsTabProps) {
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

  const totalBalance = totalCost;
  const totalBalanceUSD = totalBalance / exchangeRate;

  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">المنتجات</p>
          <p className="text-2xl font-bold text-gray-800">{products.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">إجمالي القطع</p>
          <p className="text-2xl font-bold text-indigo-600">{totalItems}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">الربح المتوقع</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${(totalProfit / exchangeRate).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      {showBalance && (
        <div className="mb-4 bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">💰 الرصيد (مجموع المصاريف)</h3>
            <button
              onClick={() => setShowBalance(false)}
              className="text-white/70 hover:text-white text-sm w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-purple-100 mb-1">بالدولار</p>
              <p className="font-bold text-2xl">${totalBalanceUSD.toFixed(2)}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs text-purple-100 mb-1">بالليرة السورية</p>
              <p className="font-bold text-xl">{fmt(totalBalance)}</p>
              <p className="text-xs text-purple-200">ل.س</p>
            </div>
          </div>
          <div className="mt-3 bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-xs text-purple-100">قيمة المخزون بسعر البيع</p>
            <p className="font-bold text-sm">${(totalValue / exchangeRate).toFixed(2)} = {fmt(totalValue)} ل.س</p>
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
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm"
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
              ? 'bg-violet-600 text-white shadow-violet-200'
              : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
          }`}
        >
          💰 الرصيد
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-indigo-200 whitespace-nowrap flex items-center gap-1.5"
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
                exchangeRate={exchangeRate}
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
        <div className="mt-4 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl p-3 flex items-center justify-between shadow-md shadow-indigo-100">
          <span className="text-sm font-medium opacity-90">إجمالي قيمة المخزون</span>
          <div className="text-right">
            <span className="font-bold text-lg">${(totalValue / exchangeRate).toFixed(2)}</span>
            <span className="text-xs text-blue-200 block">{fmt(totalValue)} ل.س</span>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddProductModal
          category={category}
          exchangeRate={exchangeRate}
          onAdd={onAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
