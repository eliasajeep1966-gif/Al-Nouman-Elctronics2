"use client";

import { useState } from 'react';
import { ProductCategory } from '@/lib/types';

interface AddProductModalProps {
  category: ProductCategory;
  exchangeRate: number;
  onAdd: (name: string, quantity: number, originalPrice: number, sellingPrice: number, originalPriceUSD?: number, sellingPriceUSD?: number) => void;
  onClose: () => void;
}

export default function AddProductModal({ category, exchangeRate, onAdd, onClose }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [originalPriceUSD, setOriginalPriceUSD] = useState('');
  const [sellingPriceUSD, setSellingPriceUSD] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryLabel = category === 'parts' ? 'قطعة غيار' : 'أداة إلكترونية';

  // تحويل الدولار للليرة السورية
  const originalPriceSYP = originalPriceUSD ? Math.round(parseFloat(originalPriceUSD) * exchangeRate) : 0;
  const sellingPriceSYP = sellingPriceUSD ? Math.round(parseFloat(sellingPriceUSD) * exchangeRate) : 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'اسم المنتج مطلوب';
    if (quantity < 1) newErrors.quantity = 'الكمية يجب أن تكون 1 على الأقل';
    if (!originalPriceUSD || parseFloat(originalPriceUSD) < 0) newErrors.originalPrice = 'السعر الأصلي مطلوب';
    if (!sellingPriceUSD || parseFloat(sellingPriceUSD) < 0) newErrors.sellingPrice = 'سعر البيع مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const origUSD = parseFloat(originalPriceUSD);
    const sellUSD = parseFloat(sellingPriceUSD);
    onAdd(
      name.trim(),
      quantity,
      Math.round(origUSD * exchangeRate),
      Math.round(sellUSD * exchangeRate),
      origUSD,
      sellUSD
    );
    onClose();
  };

  const profitUSD = sellingPriceUSD && originalPriceUSD
    ? (parseFloat(sellingPriceUSD) - parseFloat(originalPriceUSD)).toFixed(2)
    : null;

  const profitSYP = profitUSD ? Math.round(parseFloat(profitUSD) * exchangeRate) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">إضافة {categoryLabel} جديدة</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-100 text-xs mt-1">سعر الصرف: 1$ = {exchangeRate.toLocaleString()} ل.س</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`أدخل اسم ${categoryLabel}`}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              الكمية <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors flex items-center justify-center"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className={`flex-1 border rounded-lg px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.quantity ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>

          {/* Prices in USD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                السعر الأصلي ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={originalPriceUSD}
                onChange={e => setOriginalPriceUSD(e.target.value)}
                placeholder="0.00"
                min={0}
                step="0.01"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.originalPrice ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {originalPriceUSD && (
                <p className="text-xs text-gray-500 mt-1">= {originalPriceSYP.toLocaleString()} ل.س</p>
              )}
              {errors.originalPrice && <p className="text-red-500 text-xs mt-1">{errors.originalPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                سعر البيع ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={sellingPriceUSD}
                onChange={e => setSellingPriceUSD(e.target.value)}
                placeholder="0.00"
                min={0}
                step="0.01"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.sellingPrice ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {sellingPriceUSD && (
                <p className="text-xs text-gray-500 mt-1">= {sellingPriceSYP.toLocaleString()} ل.س</p>
              )}
              {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice}</p>}
            </div>
          </div>

          {/* Profit Preview */}
          {profitUSD !== null && (
            <div className={`rounded-lg p-3 text-sm font-semibold text-center ${
              parseFloat(profitUSD) >= 0
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div>الربح المتوقع: {profitUSD}$ للقطعة</div>
              <div className="text-xs mt-0.5 opacity-80">= {profitSYP?.toLocaleString()} ل.س</div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              إضافة المنتج
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
