"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/useStore';
import { supabase } from '@/lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Initialize dark mode from localStorage directly
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('noman_dark_mode') === 'true';
    }
    return false;
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transferMode, setTransferMode] = useState<'send' | 'receive' | null>(null);
  const [qrData, setQrData] = useState('');

  // Get export/import functions from store
  const { exportData, importData } = useStore();

  // Apply dark mode class on mount and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('noman_dark_mode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDeleteAll = () => {
    if (deleteConfirm === 'حذف الكل') {
      localStorage.removeItem('noman_products');
      localStorage.removeItem('noman_logs');
      localStorage.removeItem('noman_losses');
      window.location.reload();
    }
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'إلكترونيات النعمان',
          text: 'تطبيق إدارة مخزون إلكترونيات النعمان',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy URL
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط التطبيق!');
    }
  };

  const handleGenerateQR = () => {
    const data = exportData();
    // Simple base64 encoding for transfer
    setQrData(btoa(unescape(encodeURIComponent(data))));
    setTransferMode('send');
  };

  const handleReceiveQR = () => {
    setTransferMode('receive');
    setQrData('');
  };

  const handleImportQR = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const decoded = decodeURIComponent(escape(atob(e.target.value)));
      const success = importData(decoded);
      if (success) {
        alert('✅ تم استيراد البيانات بنجاح!');
        setTransferMode(null);
      } else {
        alert('❌ فشل استيراد البيانات');
      }
    } catch {
      alert('❌ خطأ في البيانات');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">⚙️ الإعدادات</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌙</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">الوضع الليلي</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Share App */}
          <button
            onClick={handleShareApp}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          >
            <span className="text-xl">📤</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">مشاركة التطبيق</span>
          </button>

          {/* Transfer Data */}
          <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">📡</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">نقل البيانات بين الأجهزة</span>
            </div>
            
            {!transferMode ? (
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateQR}
                  className="flex-1 py-2 px-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  📤 إرسال
                </button>
                <button
                  onClick={handleReceiveQR}
                  className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  📥 استلام
                </button>
              </div>
            ) : transferMode === 'send' ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  امسح هذا QR من الجهاز الآخر:
                </p>
                <textarea
                  readOnly
                  value={qrData}
                  className="w-full h-24 p-2 text-xs font-mono bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-gray-200"
                  placeholder="سيظهر الكود هنا..."
                />
                <button
                  onClick={() => setTransferMode(null)}
                  className="mt-2 w-full py-2 px-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  الصق الكود المرسل من الجهاز الآخر:
                </p>
                <textarea
                  onChange={handleImportQR}
                  className="w-full h-24 p-2 text-xs font-mono bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-gray-200"
                  placeholder="الصق الكود هنا..."
                />
                <button
                  onClick={() => setTransferMode(null)}
                  className="mt-2 w-full py-2 px-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>

          {/* Delete All Data */}
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 text-red-600 dark:text-red-400"
              >
                <span className="text-xl">🗑️</span>
                <span className="font-medium">حذف كل البيانات</span>
              </button>
            ) : (
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                  ⚠️ هذا الإجراء لا يمكن التراجع عنه!
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="اكتب: حذف الكل"
                  className="w-full p-2 mb-2 text-sm border border-red-200 dark:border-red-800 rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleteConfirm !== 'حذف الكل'}
                    className="flex-1 py-2 px-3 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    تأكيد الحذف
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); }}
                    className="flex-1 py-2 px-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
