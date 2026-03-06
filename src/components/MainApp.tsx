"use client";

import { useState } from 'react';
import { useStore } from '@/lib/useStore';
import ProductsTab from './ProductsTab';
import LogTab from './LogTab';

type TabId = 'parts' | 'tools' | 'log';

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
    icon: '🔧',
    color: 'text-gray-500',
    activeColor: 'text-blue-600',
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
  const { products, logs, isLoaded, addProduct, deleteProduct, sellProduct } = useStore();

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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">إلكترونيات النعمان</h1>
              <p className="text-blue-100 text-xs">نظام إدارة المخزون</p>
            </div>
            <div className="mr-auto flex gap-4 text-center">
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
                'bg-purple-500';
              const activeBg =
                tab.id === 'parts' ? 'text-orange-600' :
                tab.id === 'tools' ? 'text-blue-600' :
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
              onAdd={(name, qty, orig, sell) => addProduct(name, qty, orig, sell, 'parts')}
              onSell={sellProduct}
              onDelete={deleteProduct}
            />
          </div>
        )}
        {activeTab === 'tools' && (
          <div className="slide-in">
            <ProductsTab
              products={toolsProducts}
              category="tools"
              onAdd={(name, qty, orig, sell) => addProduct(name, qty, orig, sell, 'tools')}
              onSell={sellProduct}
              onDelete={deleteProduct}
            />
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
