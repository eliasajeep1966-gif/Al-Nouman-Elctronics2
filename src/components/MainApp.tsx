"use client";

import { useState, useRef } from 'react';
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
  const { products, logs, losses, exchangeRate, isLoaded, addProduct, deleteProduct, sellProduct, addLoss, setExchangeRate, exportData, importData } = useStore();

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

          {/* Exchange Rate Row */}
          <div className="flex justify-center items-center gap-3 mb-4">
            <button
              onClick={() => setShowSettings(true)}
              className="absolute left-4 top-6 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg border border-white/10 hover:bg-white/20 transition-colors"
            >
              ⚙️
            </button>
            <BackupButtons 
              onExport={handleExport} 
              onImport={handleImport}
              products={products}
              logs={logs}
              losses={losses}
            />
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
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-8 text-center">
            <div>
              <p className="text-xs text-indigo-300 mb-0.5">قطع الغيار</p>
              <p className="font-bold text-xl leading-tight">{partsProducts.length}</p>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
              <p className="text-xs text-indigo-300 mb-0.5">الأدوات</p>
              <p className="font-bold text-xl leading-tight">{toolsProducts.length}</p>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
              <p className="text-xs text-indigo-300 mb-0.5">السجل</p>
              <p className="font-bold text-xl leading-tight">{logs.length}</p>
            </div>
          </div>
        </div>
      </header>

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
              onAdd={(name, qty, orig, sell, origUSD, sellUSD) => addProduct(name, qty, orig, sell, 'parts', origUSD, sellUSD)}
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
              onAdd={(name, qty, orig, sell, origUSD, sellUSD) => addProduct(name, qty, orig, sell, 'tools', origUSD, sellUSD)}
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-3 text-center">
        <p className="text-xs text-gray-400">إلكترونيات النعمان © {new Date().getFullYear()}</p>
        <p className="text-xs text-gray-300 mt-1">BY ELIAS AJEEP</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
