"use client";

import { useMemo, useState } from 'react';
import { LogEntry, LossEntry } from '@/lib/types';
import { USD_TO_SYP } from '@/lib/useStore';

interface ProfitsTabProps {
  logs: LogEntry[];
  losses: LossEntry[];
}

function getMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return date.toLocaleString('ar-IQ', { month: 'long', year: 'numeric' });
}

export default function ProfitsTab({ logs, losses }: ProfitsTabProps) {
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // جمع كل الأشهر المتاحة
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonth);
    logs.forEach(log => {
      if (log.action === 'sold' && log.timestamp) {
        // استخراج الشهر من timestamp
        try {
          const parts = log.timestamp.split('/');
          if (parts.length >= 3) {
            const year = parts[2].split('،')[0].trim();
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
      // تحقق من الشهر - نستخدم timestamp
      try {
        const parts = log.timestamp.split('/');
        if (parts.length >= 3) {
          const year = parts[2].split('،')[0].trim();
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

  const formatSYP = (amount: number) => `${amount.toLocaleString()} ل.س`;
  const formatUSD = (amount: number) => `$${(amount / USD_TO_SYP).toFixed(2)}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Month Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">اختر الشهر:</label>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
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
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">⚙️</span>
            <h3 className="font-bold text-gray-800">صافي أرباح قطع الغيار</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-xs text-green-600 mb-1">الأرباح</p>
              <p className="font-bold text-green-700 text-sm">{formatUSD(monthlyData.partsProfit)}</p>
              <p className="text-xs text-green-500">{formatSYP(monthlyData.partsProfit)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <p className="text-xs text-red-600 mb-1">الخسائر</p>
              <p className="font-bold text-red-700 text-sm">{formatUSD(monthlyData.totalPartsLoss)}</p>
              <p className="text-xs text-red-500">{formatSYP(monthlyData.totalPartsLoss)}</p>
            </div>
            <div className={`rounded-lg p-2 text-center ${monthlyData.netPartsProfit >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
              <p className={`text-xs mb-1 ${monthlyData.netPartsProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>الصافي</p>
              <p className={`font-bold text-sm ${monthlyData.netPartsProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatUSD(monthlyData.netPartsProfit)}
              </p>
              <p className={`text-xs ${monthlyData.netPartsProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {formatSYP(monthlyData.netPartsProfit)}
              </p>
            </div>
          </div>

          {/* خسائر قطع الغيار */}
          {monthlyData.partsLosses.length > 0 && (
            <div className="mt-3 border-t border-orange-100 pt-3">
              <p className="text-xs font-semibold text-red-600 mb-2">📉 الخسائر:</p>
              <div className="space-y-1">
                {monthlyData.partsLosses.map(loss => (
                  <div key={loss.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-1.5">
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
        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🖥️</span>
            <h3 className="font-bold text-gray-800">صافي أرباح الأدوات</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-xs text-green-600 mb-1">الأرباح</p>
              <p className="font-bold text-green-700 text-sm">{formatUSD(monthlyData.toolsProfit)}</p>
              <p className="text-xs text-green-500">{formatSYP(monthlyData.toolsProfit)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <p className="text-xs text-red-600 mb-1">الخسائر</p>
              <p className="font-bold text-red-700 text-sm">{formatUSD(monthlyData.totalToolsLoss)}</p>
              <p className="text-xs text-red-500">{formatSYP(monthlyData.totalToolsLoss)}</p>
            </div>
            <div className={`rounded-lg p-2 text-center ${monthlyData.netToolsProfit >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
              <p className={`text-xs mb-1 ${monthlyData.netToolsProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>الصافي</p>
              <p className={`font-bold text-sm ${monthlyData.netToolsProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatUSD(monthlyData.netToolsProfit)}
              </p>
              <p className={`text-xs ${monthlyData.netToolsProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {formatSYP(monthlyData.netToolsProfit)}
              </p>
            </div>
          </div>

          {/* خسائر الأدوات */}
          {monthlyData.toolsLosses.length > 0 && (
            <div className="mt-3 border-t border-blue-100 pt-3">
              <p className="text-xs font-semibold text-red-600 mb-2">📉 الخسائر:</p>
              <div className="space-y-1">
                {monthlyData.toolsLosses.map(loss => (
                  <div key={loss.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-1.5">
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
        <div className={`rounded-xl p-4 shadow-sm border ${
          monthlyData.totalNet >= 0
            ? 'bg-gradient-to-l from-green-600 to-green-700 border-green-500'
            : 'bg-gradient-to-l from-red-600 to-red-700 border-red-500'
        } text-white`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📊</span>
            <h3 className="font-bold text-xl">المجموع الكلي - {getMonthLabel(selectedMonth)}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <p className="text-xs opacity-80 mb-1">صافي الربح بالدولار</p>
              <p className="font-bold text-2xl">{formatUSD(monthlyData.totalNet)}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <p className="text-xs opacity-80 mb-1">صافي الربح بالليرة</p>
              <p className="font-bold text-2xl">{monthlyData.totalNet.toLocaleString()}</p>
              <p className="text-xs opacity-70">ل.س</p>
            </div>
          </div>
          <div className="mt-3 bg-white/10 rounded-lg p-2 text-center">
            <p className="text-xs opacity-80">عدد المبيعات هذا الشهر: {monthlyData.soldCount} عملية بيع</p>
          </div>
        </div>
      </div>
    </div>
  );
}
