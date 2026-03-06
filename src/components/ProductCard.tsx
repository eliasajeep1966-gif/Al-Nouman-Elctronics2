"use client";

import { useState } from 'react';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  exchangeRate: number;
  onSell: (id: string) => void;
  onDelete: (id: string) => void;
  onLoss: (id: string) => void;
}

export default function ProductCard({ product, exchangeRate, onSell, onDelete, onLoss }: ProductCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmLoss, setShowConfirmLoss] = useState(false);

  const profit = product.sellingPrice - product.originalPrice;
  const profitPercent = product.originalPrice > 0
    ? ((profit / product.originalPrice) * 100).toFixed(1)
    : '0';

  // حساب الأسعار بالدولار
  const originalUSD = product.originalPriceUSD ?? (product.originalPrice / exchangeRate);
  const sellingUSD = product.sellingPriceUSD ?? (product.sellingPrice / exchangeRate);
  const profitUSD = sellingUSD - originalUSD;

  // السعر الكلي الأصلي (للقطع الموجودة)
  const totalOriginalUSD = originalUSD * product.quantity;
  const totalOriginalSYP = product.originalPrice * product.quantity;

  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 3;

  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200 fade-in ${
      isOutOfStock ? 'opacity-60 border-gray-200' : 'border-gray-100 hover:border-indigo-200'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{product.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{product.createdAt}</p>
          </div>
          {/* Stock Badge */}
          <div className={`mr-2 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            isOutOfStock
              ? 'bg-red-100 text-red-600'
              : isLowStock
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isOutOfStock ? 'نفد' : `${product.quantity} قطعة`}
          </div>
        </div>

        {/* Prices Grid */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">الأصلي / قطعة</p>
            <p className="font-bold text-slate-800 text-sm">${originalUSD.toFixed(2)}</p>
            <p className="text-xs text-slate-400">{fmt(product.originalPrice)} ل.س</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-2.5 text-center border border-indigo-100">
            <p className="text-xs text-indigo-500 mb-1">سعر البيع</p>
            <p className="font-bold text-indigo-700 text-sm">${sellingUSD.toFixed(2)}</p>
            <p className="text-xs text-indigo-400">{fmt(product.sellingPrice)} ل.س</p>
          </div>
          <div className={`rounded-xl p-2.5 text-center border ${profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-xs mb-1 ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>الربح</p>
            <p className={`font-bold text-sm ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {profitUSD >= 0 ? '+' : ''}${profitUSD.toFixed(2)}
            </p>
            <p className={`text-xs ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{profitPercent}%</p>
          </div>
        </div>

        {/* Total Original Cost Row */}
        {product.quantity > 0 && (
          <div className="bg-violet-50 rounded-xl px-3 py-2 mb-3 border border-violet-100 flex items-center justify-between">
            <span className="text-xs text-violet-600 font-semibold">💰 الكلفة الكلية ({product.quantity} قطعة)</span>
            <div className="text-right">
              <span className="text-sm font-bold text-violet-800">${totalOriginalUSD.toFixed(2)}</span>
              <span className="text-xs text-violet-500 block">{fmt(totalOriginalSYP)} ل.س</span>
            </div>
          </div>
        )}

        {/* Loss Confirm */}
        {showConfirmLoss && (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mb-2">
            <p className="text-amber-800 text-xs font-semibold text-center mb-2">
              📉 تسجيل خسارة قطعة واحدة بسعر أصلي ${originalUSD.toFixed(2)}؟
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { onLoss(product.id); setShowConfirmLoss(false); }}
                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                نعم، سجّل
              </button>
              <button
                onClick={() => setShowConfirmLoss(false)}
                className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!showConfirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => onSell(product.id)}
              disabled={isOutOfStock}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-sm shadow-emerald-200'
              }`}
            >
              {isOutOfStock ? 'نفد المخزون' : '✓ تم البيع'}
            </button>
            <button
              onClick={() => setShowConfirmLoss(!showConfirmLoss)}
              disabled={isOutOfStock}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200'
              }`}
              title="تسجيل خسارة"
            >
              📉
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-sm font-bold transition-all active:scale-95 border border-red-100"
            >
              🗑
            </button>
          </div>
        ) : (
          <div className="bg-red-50 rounded-xl p-3 border border-red-200">
            <p className="text-red-700 text-xs font-semibold text-center mb-2">
              هل تريد حذف هذا المنتج؟
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(product.id)}
                className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
