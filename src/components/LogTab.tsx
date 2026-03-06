"use client";

import { useState, useMemo } from 'react';
import { LogEntry } from '@/lib/types';

interface LogTabProps {
  logs: LogEntry[];
}

const actionLabels: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  added: { label: 'تمت الإضافة', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '✚' },
  deleted: { label: 'تم الحذف', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '✕' },
  sold: { label: 'تم البيع', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '✓' },
};

const categoryLabels: Record<string, string> = {
  parts: 'قطع الغيار',
  tools: 'الأدوات',
};

export default function LogTab({ logs }: LogTabProps) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = logs;
    if (filterAction !== 'all') {
      result = result.filter(l => l.action === filterAction);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(l => l.productName.toLowerCase().includes(q));
    }
    return result;
  }, [logs, search, filterAction]);

  const totalSold = logs.filter(l => l.action === 'sold').length;
  const totalProfit = logs
    .filter(l => l.action === 'sold')
    .reduce((sum, l) => sum + (l.profit || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">إجمالي السجلات</p>
          <p className="text-xl font-bold text-gray-800">{logs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">عمليات البيع</p>
          <p className="text-xl font-bold text-blue-600">{totalSold}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">إجمالي الأرباح</p>
          <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="البحث في السجل..."
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
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
        >
          <option value="all">الكل</option>
          <option value="added">الإضافات</option>
          <option value="sold">المبيعات</option>
          <option value="deleted">المحذوفات</option>
        </select>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium text-lg">
              {search || filterAction !== 'all' ? 'لا توجد نتائج' : 'السجل فارغ'}
            </p>
            {!search && filterAction === 'all' && (
              <p className="text-gray-400 text-sm mt-1">
                ستظهر هنا جميع العمليات من إضافة وبيع وحذف
              </p>
            )}
          </div>
        ) : (
          filtered.map(log => {
            const style = actionLabels[log.action] || actionLabels.added;
            return (
              <div
                key={log.id}
                className={`rounded-xl border p-3.5 fade-in ${style.bg}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      log.action === 'added' ? 'bg-green-200 text-green-800' :
                      log.action === 'deleted' ? 'bg-red-200 text-red-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{log.productName}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          log.action === 'added' ? 'bg-green-200 text-green-800' :
                          log.action === 'deleted' ? 'bg-red-200 text-red-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {style.label}
                        </span>
                        <span className="text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                          {categoryLabels[log.category]}
                        </span>
                      </div>

                      {/* Details */}
                      {log.action !== 'deleted' && (
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {log.quantity !== undefined && (
                            <span className="text-xs text-gray-600">
                              الكمية: <strong>{log.quantity}</strong>
                            </span>
                          )}
                          {log.originalPrice !== undefined && (
                            <span className="text-xs text-gray-600">
                              الأصلي: <strong>{log.originalPrice.toLocaleString()} د.ع</strong>
                            </span>
                          )}
                          {log.sellingPrice !== undefined && (
                            <span className="text-xs text-gray-600">
                              البيع: <strong>{log.sellingPrice.toLocaleString()} د.ع</strong>
                            </span>
                          )}
                          {log.profit !== undefined && (
                            <span className={`text-xs font-bold ${log.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              الربح: {log.profit >= 0 ? '+' : ''}{log.profit.toLocaleString()} د.ع
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 text-left">
                    {log.timestamp}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
