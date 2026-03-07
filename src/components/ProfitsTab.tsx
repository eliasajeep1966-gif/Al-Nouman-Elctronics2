"use client";

import { useMemo, useState } from 'react';
import { LogEntry, LossEntry } from '@/lib/types';

interface ProfitsTabProps {
  logs: LogEntry[];
  losses: LossEntry[];
  exchangeRate: number;
}

function getMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return date.toLocaleString('ar-SY', { month: 'long', year: 'numeric' });
}

export default function ProfitsTab({ logs, losses, exchangeRate }: ProfitsTabProps) {
  const currentMonth = useMemo(() => {
    const now = new Date();
    const damascusDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Damascus' }));
    return `${damascusDate.getFullYear()}-${String(damascusDate.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // جمع كل الأشهر المتاحة
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonth);
    logs.forEach(log => {
      if (log.action === 'sold' && log.timestamp) {
        try {
          // timestamp format: DD/MM/YYYY, HH:MM:SS
          const parts = log.timestamp.split('/');
          if (parts.length >= 3) {
            const year = parts[2].split(',')[0].trim();
            const month = parts[1].padStart(2, '0');
            months.add(`${year}-${month}`);
          }
        } catch { /* ignore */ }
      }
    });
    losses.forEach(loss => {
      if (loss.month) months.add(loss.month);
    });
    return Array.from(months).sort().reverse();
  }, [logs, losses, currentMonth]);

  // حساب الأرباح من المبيعات للشهر المحدد
  const monthlyData = useMemo(() => {
    const soldLogs = logs.filter(log => {
      if (log.action !== 'sold') return false;
      try {
        const parts = log.timestamp.split('/');
        if (parts.length >= 3) {
          const year = parts[2].split(',')[0].trim();
          const month = parts[1].padStart(2, '0');
          return `${year}-${month}` === selectedMonth;
        }
      } catch { /* ignore */ }
      return false;
    });

    const partsProfit = soldLogs
      .filter(l => l.category === 'parts')
      .reduce((sum, l) => sum + (l.profit ?? 0), 0);

    const toolsProfit = soldLogs
      .filter(l => l.category === 'tools')
      .reduce((sum, l) => sum + (l.profit ?? 0), 0);

    const monthLosses = losses.filter(l => l.month === selectedMonth);
    const partsLosses = monthLosses.filter(l => l.category === 'parts');
    const toolsLosses = monthLosses.filter(l => l.category === 'tools');

    const totalPartsLoss = partsLosses.reduce((sum, l) => sum + l.amount, 0);
    const totalToolsLoss = toolsLosses.reduce((sum, l) => sum + l.amount, 0);

    const netPartsProfit = partsProfit - totalPartsLoss;
    const netToolsProfit = toolsProfit - totalToolsLoss;
    const totalNet = netPartsProfit + netToolsProfit;

    return {
      partsProfit,
      toolsProfit,
      totalPartsLoss,
      totalToolsLoss,
      partsLosses,
      toolsLosses,
      netPartsProfit,
      netToolsProfit,
      totalNet,
      soldCount: soldLogs.length,
    };
  }, [logs, losses, selectedMonth]);

  const fmt = (n: number) => n.toLocaleString('en-US');
  const formatSYP = (amount: number) => `${fmt(amount)} ل.س`;
  const formatUSD = (amount: number) => `$${(amount / exchangeRate).toFixed(2)}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Month Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">اختر الشهر:</label>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          {availableMonths.map(month => (
            <option key={month} value={month}>
              {getMonthLabel(month)} {month === currentMonth ? '(الشهر الحالي)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3">
        {/* قطع الغيار */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-xl">⚙️</div>
            <h3 className="font-bold text-gray-800">صافي أرباح قطع الغيار</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
              <p className="text-xs text-emerald-600 mb-1">الأرباح</p>
              <p className="font-bold text-emerald-700 text-sm">{formatSYP(monthlyData.partsProfit)}</p>
              <p className="text-xs text-emerald-500">{formatUSD(monthlyData.partsProfit)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
              <p className="text-xs text-red-600 mb-1">الخسائر</p>
              <p className="font-bold text-red-700 text-sm">{formatSYP(monthlyData.totalPartsLoss)}</p>
              <p className="text-xs text-red-500">{formatUSD(monthlyData.totalPartsLoss)}</p>
            </div>
            <div className={`rounded-xl p-2.5 text-center border ${monthlyData.netPartsProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-100 border-red-200'}`}>
              <p className={`text-xs mb-1 ${monthlyData.netPartsProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>الصافي</p>
              <p className={`font-bold text-sm ${monthlyData.netPartsProfit >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                {formatSYP(monthlyData.netPartsProfit)}
              </p>
              <p className={`text-xs ${monthlyData.netPartsProfit >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                {formatUSD(monthlyData.netPartsProfit)}
              </p>
            </div>
          </div>

          {monthlyData.partsLosses.length > 0 && (
            <div className="mt-3 border-t border-orange-100 pt-3">
              <p className="text-xs font-semibold text-red-600 mb-2">📉 الخسائر:</p>
              <div className="space-y-1">
                {monthlyData.partsLosses.map(loss => (
                  <div key={loss.id} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-1.5 border border-red-100">
                    <span className="text-xs text-gray-700">{loss.productName}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-600">{formatUSD(loss.amount)}</span>
                      <span className="text-xs text-red-400 block">{formatSYP(loss.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* الأدوات */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🖥️</div>
            <h3 className="font-bold text-gray-800">صافي أرباح الأدوات</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
              <p className="text-xs text-emerald-600 mb-1">الأرباح</p>
              <p className="font-bold text-emerald-700 text-sm">{formatSYP(monthlyData.toolsProfit)}</p>
              <p className="text-xs text-emerald-500">{formatUSD(monthlyData.toolsProfit)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
              <p className="text-xs text-red-600 mb-1">الخسائر</p>
              <p className="font-bold text-red-700 text-sm">{formatSYP(monthlyData.totalToolsLoss)}</p>
              <p className="text-xs text-red-500">{formatUSD(monthlyData.totalToolsLoss)}</p>
            </div>
            <div className={`rounded-xl p-2.5 text-center border ${monthlyData.netToolsProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-100 border-red-200'}`}>
              <p className={`text-xs mb-1 ${monthlyData.netToolsProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>الصافي</p>
              <p className={`font-bold text-sm ${monthlyData.netToolsProfit >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                {formatSYP(monthlyData.netToolsProfit)}
              </p>
              <p className={`text-xs ${monthlyData.netToolsProfit >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                {formatUSD(monthlyData.netToolsProfit)}
              </p>
            </div>
          </div>

          {monthlyData.toolsLosses.length > 0 && (
            <div className="mt-3 border-t border-indigo-100 pt-3">
              <p className="text-xs font-semibold text-red-600 mb-2">📉 الخسائر:</p>
              <div className="space-y-1">
                {monthlyData.toolsLosses.map(loss => (
                  <div key={loss.id} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-1.5 border border-red-100">
                    <span className="text-xs text-gray-700">{loss.productName}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-600">{formatUSD(loss.amount)}</span>
                      <span className="text-xs text-red-400 block">{formatSYP(loss.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* المجموع الكلي */}
        <div className={`rounded-2xl p-4 shadow-md border ${
          monthlyData.totalNet >= 0
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500'
            : 'bg-gradient-to-br from-red-600 to-rose-700 border-red-500'
        } text-white`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-xl">📊</div>
            <h3 className="font-bold text-xl">المجموع الكلي — {getMonthLabel(selectedMonth)}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs opacity-80 mb-1">صافي الربح بالليرة</p>
              <p className="font-bold text-2xl">{fmt(monthlyData.totalNet)}</p>
              <p className="text-xs opacity-70">ل.س</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs opacity-80 mb-1">صافي الربح بالدولار</p>
              <p className="font-bold text-2xl">{formatUSD(monthlyData.totalNet)}</p>
            </div>
          </div>
          <div className="mt-3 bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-xs opacity-80">عدد المبيعات هذا الشهر: {monthlyData.soldCount} عملية بيع</p>
          </div>
        </div>
      </div>
    </div>
  );
}
