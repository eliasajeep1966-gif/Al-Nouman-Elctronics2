"use client";

import { useState } from 'react';
import { Product } from '@/lib/types';
import { USD_TO_SYP } from '@/lib/useStore';

interface ProductCardProps {
  product: Product;
  onSell: (id: string) => void;
  onDelete: (id: string) => void;
  onLoss: (id: string, amount: number) => void;
}

export default function ProductCard({ product, onSell, onDelete, onLoss }: ProductCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showLossInput, setShowLossInput] = useState(false);
  const [lossAmountUSD, setLossAmountUSD] = useState('');

  const profit = product.sellingPrice - product.originalPrice;
  const profitPercent = product.originalPrice > 0
    ? ((profit / product.originalPrice) * 100).toFixed(1)
    : '0';

  // حساب الأسعار بالدولار
  const originalUSD = product.originalPriceUSD ?? (product.originalPrice / USD_TO_SYP);
  const sellingUSD = product.sellingPriceUSD ?? (product.sellingPrice / USD_TO_SYP);
  const profitUSD = sellingUSD - originalUSD;

  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 3;

  const handleLossSubmit = () => {
    const amount = parseFloat(lossAmountUSD);
    if (!isNaN(amount) && amount > 0) {
      onLoss(product.id, Math.round(amount * USD_TO_SYP));
      setLossAmountUSD('');
      setShowLossInput(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md fade-in ${
      isOutOfStock ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:border-blue-200'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-base leading-tight truncate">{product.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{product.createdAt}</p>
          </div>
          {/* Stock Badge */}
          <div className={`mr-2 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            isOutOfStock
              ? 'bg-red-100 text-red-600'
              : isLowStock
              ? 'bg-orange-100 text-orange-600'
              : 'bg-green-100 text-green-700'
          }`}>
            {isOutOfStock ? 'نفد المخزون' : `${product.quantity} قطعة`}
          </div>
        </div>

        {/* Prices Grid - بالدولار والليرة */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 mb-0.5">السعر الأصلي</p>
            <p className="font-bold text-gray-700 text-sm">${originalUSD.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{product.originalPrice.toLocaleString()} ل.س</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-blue-500 mb-0.5">سعر البيع</p>
            <p className="font-bold text-blue-700 text-sm">${sellingUSD.toFixed(2)}</p>
            <p className="text-xs text-blue-400">{product.sellingPrice.toLocaleString()} ل.س</p>
          </div>
          <div className={`rounded-lg p-2 text-center ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`text-xs mb-0.5 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>الربح</p>
            <p className={`font-bold text-sm ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {profitUSD >= 0 ? '+' : ''}${profitUSD.toFixed(2)}
            </p>
            <p className={`text-xs ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{profitPercent}%</p>
          </div>
        </div>

        {/* Loss Input */}
        {showLossInput && (
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-2">
            <p className="text-orange-700 text-xs font-semibold mb-2">أدخل مبلغ الخسارة بالدولار:</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={lossAmountUSD}
                onChange={e => setLossAmountUSD(e.target.value)}
                placeholder="0.00 $"
                min={0}
                step="0.01"
                className="flex-1 border border-orange-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={handleLossSubmit}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                تأكيد
              </button>
              <button
                onClick={() => { setShowLossInput(false); setLossAmountUSD(''); }}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors"
              >
                إلغاء
              </button>
            </div>
            {lossAmountUSD && (
              <p className="text-xs text-orange-600 mt-1">= {Math.round(parseFloat(lossAmountUSD) * USD_TO_SYP).toLocaleString()} ل.س</p>
            )}
          </div>
        )}

        {/* Actions */}
        {!showConfirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => onSell(product.id)}
              disabled={isOutOfStock}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
              }`}
            >
              {isOutOfStock ? 'نفد المخزون' : '✓ تم البيع'}
            </button>
            <button
              onClick={() => setShowLossInput(!showLossInput)}
              className="px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition-all active:scale-95"
              title="تسجيل خسارة"
            >
              📉
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-sm font-bold transition-all active:scale-95"
            >
              🗑
            </button>
          </div>
        ) : (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
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
                className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors"
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
