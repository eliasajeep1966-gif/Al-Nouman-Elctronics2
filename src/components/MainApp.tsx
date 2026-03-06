"use client";

import { useState } from 'react';
import { useStore } from '@/lib/useStore';
import ProductsTab from './ProductsTab';
import LogTab from './LogTab';
import ProfitsTab from './ProfitsTab';

type TabId = 'parts' | 'tools' | 'profits' | 'log';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  color: string;
  activeColor: string;
}

const tabs: Tab[] = [
  {
    id: 'parts',
    label: 'قطع الغيار',
    icon: '⚙️',
    color: 'text-gray-500',
    activeColor: 'text-orange-600',
  },
  {
    id: 'tools',
    label: 'الأدوات',
    icon: '🖥️',
    color: 'text-gray-500',
    activeColor: 'text-blue-600',
  },
  {
    id: 'profits',
    label: 'الأرباح',
    icon: '📊',
    color: 'text-gray-500',
    activeColor: 'text-green-600',
  },
  {
    id: 'log',
    label: 'السجل',
    icon: '📋',
    color: 'text-gray-500',
    activeColor: 'text-purple-600',
  },
];

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<TabId>('parts');
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const { products, logs, losses, exchangeRate, isLoaded, addProduct, deleteProduct, sellProduct, addLoss, setExchangeRate } = useStore();

  const partsProducts = products.filter(p => p.category === 'parts');
  const toolsProducts = products.filter(p => p.category === 'tools');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⚡</div>
          <p className="text-gray-500 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-l from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex flex-col items-center text-center mb-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-2">
              ⚡
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-wide">إلكترونيات النعمان</h1>
            <p className="text-blue-100 text-sm mt-1">نظام إدارة المخزون</p>
          </div>

          {/* Exchange Rate Row */}
          <div className="flex justify-center mb-3">
            <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-blue-100 text-xs">💱 سعر الدولار:</span>
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
                  <span className="text-blue-100 text-xs">ل.س</span>
                  <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-bold px-2 py-1 rounded-lg transition-colors">✓</button>
                  <button type="button" onClick={() => setEditingRate(false)} className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-lg transition-colors">✕</button>
                </form>
              ) : (
                <button
                  onClick={() => { setRateInput(exchangeRate.toString()); setEditingRate(true); }}
                  className="flex items-center gap-1 group"
                >
                  <span className="text-white font-bold text-sm">{exchangeRate.toLocaleString()} ل.س</span>
                  <span className="text-blue-200 text-xs group-hover:text-yellow-300 transition-colors">✏️</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-xs text-blue-200">قطع الغيار</p>
              <p className="font-bold text-lg leading-tight">{partsProducts.length}</p>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <p className="text-xs text-blue-200">الأدوات</p>
              <p className="font-bold text-lg leading-tight">{toolsProducts.length}</p>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <p className="text-xs text-blue-200">السجل</p>
              <p className="font-bold text-lg leading-tight">{logs.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const indicatorColor =
                tab.id === 'parts' ? 'bg-orange-500' :
                tab.id === 'tools' ? 'bg-blue-500' :
                tab.id === 'profits' ? 'bg-green-500' :
                'bg-purple-500';
              const activeBg =
                tab.id === 'parts' ? 'text-orange-600' :
                tab.id === 'tools' ? 'text-blue-600' :
                tab.id === 'profits' ? 'text-green-600' :
                'text-purple-600';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 relative transition-all ${
                    isActive ? activeBg : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-xs font-semibold">{tab.label}</span>
                  {isActive && (
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${indicatorColor} rounded-t-full`} />
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
      </footer>
    </div>
  );
}
