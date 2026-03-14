"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/useStore';
import ProductsTab from './ProductsTab';
import LogTab from './LogTab';
import ProfitsTab from './ProfitsTab';
import BackupButtons from './BackupButtons';
import SettingsModal from './SettingsModal';

type TabId = 'parts' | 'tools' | 'profits' | 'log';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'parts', label: 'قطع الغيار', icon: '⚙️' },
  { id: 'tools', label: 'الأدوات', icon: '🖥️' },
  { id: 'profits', label: 'الأرباح', icon: '📊' },
  { id: 'log', label: 'السجل', icon: '📋' },
];

const tabColors: Record<TabId, { active: string; indicator: string; shadow: string }> = {
  parts:   { active: 'text-orange-600',  indicator: 'bg-orange-500',  shadow: 'shadow-orange-100' },
  tools:   { active: 'text-indigo-600',  indicator: 'bg-indigo-500',  shadow: 'shadow-indigo-100' },
  profits: { active: 'text-emerald-600', indicator: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
  log:     { active: 'text-purple-600',  indicator: 'bg-purple-500',  shadow: 'shadow-purple-100' },
};

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<TabId>('parts');
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [displayUsername, setDisplayUsername] = useState('...');
  const { products, logs, losses, exchangeRate, isLoaded, isOnline, addProduct, deleteProduct, sellProduct, addLoss, setExchangeRate, exportData, importData } = useStore();

  useEffect(() => {
    setDisplayUsername(localStorage.getItem('noman_username') || 'غير محدد');
  }, []);

  const partsProducts = products.filter(p => p.category === 'parts');
  const toolsProducts = products.filter(p => p.category === 'tools');

  // دالة تصدير البيانات لملف JSON
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `noman-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // دالة استيراد البيانات من ملف JSON
  const handleImport = (jsonString: string) => {
    const success = importData(jsonString);
    if (success) {
      alert('✅ تم استعادة البيانات بنجاح!');
      window.location.reload();
    } else {
      alert('❌ فشل استعادة البيانات. تأكد من صحة الملف.');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⚡</div>
          <p className="text-gray-500 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
          {/* Title Row */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mb-2 border border-white/10 shadow-lg">
              ⚡
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-wide bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              إلكترونيات النعمان
            </h1>
          </div>

          {/* Exchange Rate Row - Dollar Price Stays */}
          <div className="flex justify-between items-center gap-3 mb-4">
            {/* User Info - Left Side */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-lg">👤</span>
              <div className="flex flex-col">
                <span className="text-xs text-indigo-300">المستخدم</span>
                <span className="text-white font-bold text-sm">
                  {displayUsername}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg border border-white/10 hover:bg-white/20 transition-colors px-3 py-2"
            >
              <span className="text-xl">⚙️</span>
            </button>
            <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-indigo-300 text-xs font-medium">💱 سعر الدولار:</span>
              {editingRate ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const val = parseInt(rateInput);
                    if (val > 0) setExchangeRate(val);
                    setEditingRate(false);
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    autoFocus
                    type="number"
                    value={rateInput}
                    onChange={e => setRateInput(e.target.value)}
                    className="w-24 text-center text-sm font-bold text-gray-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    min={1}
                  />
                  <span className="text-indigo-300 text-xs">ل.س</span>
                  <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-bold px-2 py-1 rounded-lg transition-colors">✓</button>
                  <button type="button" onClick={() => setEditingRate(false)} className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-2 py-1 rounded-lg transition-colors">✕</button>
                </form>
              ) : (
                <button
                  onClick={() => { setRateInput(exchangeRate.toString()); setEditingRate(true); }}
                  className="flex items-center gap-1.5 group"
                >
                  <span className="text-white font-bold text-sm">{exchangeRate.toLocaleString('en-US')} ل.س</span>
                  <span className="text-indigo-300 text-xs group-hover:text-yellow-300 transition-colors">✏️</span>
                </button>
              )}
              {/* مؤشر حالة الاتصال */}
              <div className={`flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span>{isOnline ? 'متصل' : 'غير متصل'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Left Side Section - Below Settings */}
      <div className="bg-gradient-to-b from-slate-100 to-white py-4 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          {/* Stats Row on Left */}
          <div className="flex justify-center gap-6 text-center mb-4">
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-0.5">قطع الغيار</p>
              <p className="font-bold text-lg leading-tight text-orange-600">{partsProducts.length}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-0.5">الأدوات</p>
              <p className="font-bold text-lg leading-tight text-indigo-600">{toolsProducts.length}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-0.5">السجل</p>
              <p className="font-bold text-lg leading-tight text-purple-600">{logs.length}</p>
            </div>
          </div>

          {/* Backup Buttons */}
          <div className="flex justify-center">
            <BackupButtons 
              onExport={handleExport} 
              onImport={handleImport}
              products={products}
              logs={logs}
              losses={losses}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const colors = tabColors[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 relative transition-all duration-200 ${
                    isActive ? colors.active : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-xs font-semibold">{tab.label}</span>
                  {isActive && (
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colors.indicator} rounded-t-full`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4">
        {activeTab === 'parts' && (
          <div className="slide-in">
            <ProductsTab
              products={partsProducts}
              category="parts"
              exchangeRate={exchangeRate}
              onAdd={(name, qty, orig, sell, origUSD, sellUSD, specs) => addProduct(name, qty, orig, sell, 'parts', origUSD, sellUSD, specs)}
              onSell={sellProduct}
              onDelete={deleteProduct}
              onLoss={addLoss}
            />
          </div>
        )}
        {activeTab === 'tools' && (
          <div className="slide-in">
            <ProductsTab
              products={toolsProducts}
              category="tools"
              exchangeRate={exchangeRate}
              onAdd={(name, qty, orig, sell, origUSD, sellUSD, specs) => addProduct(name, qty, orig, sell, 'tools', origUSD, sellUSD, specs)}
              onSell={sellProduct}
              onDelete={deleteProduct}
              onLoss={addLoss}
            />
          </div>
        )}
        {activeTab === 'profits' && (
          <div className="slide-in">
            <ProfitsTab logs={logs} losses={losses} exchangeRate={exchangeRate} />
          </div>
        )}
        {activeTab === 'log' && (
          <div className="slide-in">
            <LogTab logs={logs} />
          </div>
        )}
      </main>

      {/* Footer with decorative boxes */}
      <footer className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-6 text-center shadow-2xl border-t border-slate-700">
        {/* Decorative boxes row */}
        <div className="flex justify-center gap-3 mb-4">
          <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-lg"></div>
          <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-lg"></div>
          <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-lg"></div>
          <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-lg"></div>
          <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-lg"></div>
        </div>
        <p className="text-white font-bold text-xl tracking-wider mb-2">إلكترونيات النعمان</p>
        <p className="text-lg font-semibold tracking-widest bg-gradient-to-r from-amber-700 via-amber-600 to-white bg-clip-text text-transparent">BY ELIAS AJEEP</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
