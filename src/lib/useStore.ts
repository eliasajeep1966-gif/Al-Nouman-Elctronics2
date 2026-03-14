"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Product, LogEntry, LossEntry, ProductCategory } from './types';
import { supabase, TABLES } from './supabase';

const PRODUCTS_KEY = 'noman_products';
const LOGS_KEY = 'noman_logs';
const LOSSES_KEY = 'noman_losses';
const EXCHANGE_RATE_KEY = 'noman_exchange_rate';

// سعر صرف دولار افتراضي
export const DEFAULT_USD_TO_SYP = 14000;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('en-GB', {
    timeZone: 'Asia/Damascus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getCurrentMonth(): string {
  const now = new Date();
  const damascusDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Damascus' }));
  return `${damascusDate.getFullYear()}-${String(damascusDate.getMonth() + 1).padStart(2, '0')}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // ignore
  }
  return fallback;
}

// مزامنة البيانات مع Supabase
async function syncProductsToSupabase(products: Product[]) {
  try {
    const { data, error } = await supabase.from(TABLES.PRODUCTS).upsert(
      products.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        original_price: p.originalPrice,
        selling_price: p.sellingPrice,
        original_price_usd: p.originalPriceUSD || 0,
        selling_price_usd: p.sellingPriceUSD || 0,
        category: p.category,
        specifications: p.specifications || '',
        created_at: p.createdAt,
      }))
    ).select();
    
    if (error) {
      console.error('Supabase products upsert error:', error);
    } else {
      console.log('Products synced to Supabase:', data?.length || 0, 'items');
    }
  } catch (e) {
    console.error('Error syncing products:', e);
  }
}

async function syncLogsToSupabase(logs: LogEntry[]) {
  try {
    const { data, error } = await supabase.from(TABLES.LOGS).upsert(
      logs.map(l => ({
        id: l.id,
        product_id: l.productId || '',
        product_name: l.productName,
        action: l.action,
        quantity: l.quantity || 0,
        original_price: l.originalPrice || 0,
        selling_price: l.sellingPrice || 0,
        original_price_usd: l.originalPriceUSD || 0,
        selling_price_usd: l.sellingPriceUSD || 0,
        profit: l.profit || 0,
        profit_usd: l.profitUSD || 0,
        loss_amount: l.lossAmount || 0,
        loss_amount_usd: l.lossAmountUSD || 0,
        category: l.category,
        timestamp: l.timestamp,
        performed_by: l.performedBy || '',
      }))
    ).select();
    
    if (error) {
      console.error('Supabase logs upsert error:', error);
    } else {
      console.log('Logs synced to Supabase:', data?.length || 0, 'items');
    }
  } catch (e) {
    console.error('Error syncing logs:', e);
  }
}

async function syncLossesToSupabase(losses: LossEntry[]) {
  try {
    const { data, error } = await supabase.from(TABLES.LOSSES).upsert(
      losses.map(l => ({
        id: l.id,
        product_name: l.productName,
        amount: l.amount,
        amount_usd: l.amountUSD || 0,
        category: l.category,
        timestamp: l.timestamp,
        month: l.month,
      }))
    ).select();
    
    if (error) {
      console.error('Supabase losses upsert error:', error);
    } else {
      console.log('Losses synced to Supabase:', data?.length || 0, 'items');
    }
  } catch (e) {
    console.error('Error syncing losses:', e);
  }
}

// تحميل البيانات من Supabase
async function loadFromSupabase() {
  try {
    const [productsRes, logsRes, lossesRes, settingsRes] = await Promise.all([
      supabase.from(TABLES.PRODUCTS).select('*').order('created_at', { ascending: false }),
      supabase.from(TABLES.LOGS).select('*').order('timestamp', { ascending: false }),
      supabase.from(TABLES.LOSSES).select('*').order('timestamp', { ascending: false }),
      supabase.from(TABLES.SETTINGS).select('*').eq('id', 'app_settings').single(),
    ]);

    const products: Product[] = (productsRes.data || []).map(p => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      originalPrice: p.original_price,
      sellingPrice: p.selling_price,
      originalPriceUSD: p.original_price_usd,
      sellingPriceUSD: p.selling_price_usd,
      category: p.category,
      specifications: p.specifications,
      createdAt: p.created_at,
    }));

    const logs: LogEntry[] = (logsRes.data || []).map(l => ({
      id: l.id,
      productId: l.product_id,
      productName: l.product_name,
      action: l.action,
      quantity: l.quantity,
      originalPrice: l.original_price,
      sellingPrice: l.selling_price,
      originalPriceUSD: l.original_price_usd,
      sellingPriceUSD: l.selling_price_usd,
      profit: l.profit,
      profitUSD: l.profit_usd,
      lossAmount: l.loss_amount,
      lossAmountUSD: l.loss_amount_usd,
      category: l.category,
      timestamp: l.timestamp,
      performedBy: l.performed_by || undefined,
    }));

    const losses: LossEntry[] = (lossesRes.data || []).map(l => ({
      id: l.id,
      productName: l.product_name,
      amount: l.amount,
      amountUSD: l.amount_usd,
      category: l.category,
      timestamp: l.timestamp,
      month: l.month,
    }));

    const exchangeRate = settingsRes.data?.exchange_rate || DEFAULT_USD_TO_SYP;

    // حفظ في التخزين المحلي كنسخة احتياطية
    if (products.length > 0) localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    if (logs.length > 0) localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    if (losses.length > 0) localStorage.setItem(LOSSES_KEY, JSON.stringify(losses));
    localStorage.setItem(EXCHANGE_RATE_KEY, JSON.stringify(exchangeRate));

    return { products, logs, losses, exchangeRate, fromCloud: true };
  } catch (e) {
    console.error('Error loading from Supabase:', e);
    return null;
  }
}

export function useStore() {
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage<Product[]>(PRODUCTS_KEY, [])
  );
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    loadFromStorage<LogEntry[]>(LOGS_KEY, [])
  );
  const [losses, setLosses] = useState<LossEntry[]>(() =>
    loadFromStorage<LossEntry[]>(LOSSES_KEY, [])
  );
  const [exchangeRate, setExchangeRateState] = useState<number>(() =>
    loadFromStorage<number>(EXCHANGE_RATE_KEY, DEFAULT_USD_TO_SYP)
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null);
  const currentUserRef = useRef<string>('Unknown');

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userEmail = user.email?.split('@')[0] || 'Unknown';
        setCurrentUser({ email: user.email || 'Unknown', id: user.id });
        currentUserRef.current = userEmail;
      }
    };
    getUser();
  }, []);

  // فحص حالة الاتصال
  useEffect(() => {
    // فحص أولي
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      // محاولة مزامنة عند العودة للنت
      syncProductsToSupabase(products);
      syncLogsToSupabase(logs);
      syncLossesToSupabase(losses);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [products, logs, losses]);

  // تحميل البيانات عند البداية - Offline First
  useEffect(() => {
    const loadData = async () => {
      // أولاً: تحميل من التخزين المحلي
      const localProducts = loadFromStorage<Product[]>(PRODUCTS_KEY, []);
      const localLogs = loadFromStorage<LogEntry[]>(LOGS_KEY, []);
      const localLosses = loadFromStorage<LossEntry[]>(LOSSES_KEY, []);
      const localRate = loadFromStorage<number>(EXCHANGE_RATE_KEY, DEFAULT_USD_TO_SYP);

      // إذا كان هناك نت، حاول تحميل من السحابة
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const cloudData = await loadFromSupabase();
        
        if (cloudData && cloudData.products.length > 0) {
          // استخدم بيانات السحابة (الأحدث)
          setProducts(cloudData.products);
          setLogs(cloudData.logs);
          setLosses(cloudData.losses);
          setExchangeRateState(cloudData.exchangeRate);
        } else if (localProducts.length > 0) {
          // إذا السحابة فارغة لكن المحلي فيه بيانات، ارفعها للسحابة
          await syncProductsToSupabase(localProducts);
          await syncLogsToSupabase(localLogs);
          await syncLossesToSupabase(localLosses);
        }
      } else {
        // بدون نت: استخدم البيانات المحلية
        if (localProducts.length > 0) {
          setProducts(localProducts);
          setLogs(localLogs);
          setLosses(localLosses);
          setExchangeRateState(localRate);
        }
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // مزامنة تلقائية كل 5 ثواني عند الاتصال
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(async () => {
      const cloudData = await loadFromSupabase();
      if (cloudData && cloudData.products.length > 0) {
        // مقارنة مع البيانات المحلية وتحديث إذا كانت السحابة أحدث
        const localProducts = loadFromStorage<Product[]>(PRODUCTS_KEY, []);
        const localLogs = loadFromStorage<LogEntry[]>(LOGS_KEY, []);
        const localLosses = loadFromStorage<LossEntry[]>(LOSSES_KEY, []);
        
        // إذا اختلفت البيانات، حدث المحلية
        if (JSON.stringify(cloudData.products) !== JSON.stringify(localProducts)) {
          setProducts(cloudData.products);
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(cloudData.products));
        }
        if (JSON.stringify(cloudData.logs) !== JSON.stringify(localLogs)) {
          setLogs(cloudData.logs);
          localStorage.setItem(LOGS_KEY, JSON.stringify(cloudData.logs));
        }
        if (JSON.stringify(cloudData.losses) !== JSON.stringify(localLosses)) {
          setLosses(cloudData.losses);
          localStorage.setItem(LOSSES_KEY, JSON.stringify(cloudData.losses));
        }
      }
    }, 5000); // كل 5 ثواني

    return () => clearInterval(interval);
  }, [isOnline]);

  // اشتراك Realtime للمزامنة الفورية
  useEffect(() => {
    if (!isOnline) return;

    // الاشتراك في جدول المنتجات
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.PRODUCTS }, (payload) => {
        console.log('Products changed:', payload);
        // إعادة تحميل البيانات عند حدوث تغيير
        loadFromSupabase().then(cloudData => {
          if (cloudData) {
            setProducts(cloudData.products);
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(cloudData.products));
          }
        });
      })
      .subscribe();

    // الاشتراك في جدول السجلات
    const logsChannel = supabase
      .channel('logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.LOGS }, (payload) => {
        console.log('Logs changed:', payload);
        loadFromSupabase().then(cloudData => {
          if (cloudData) {
            setLogs(cloudData.logs);
            localStorage.setItem(LOGS_KEY, JSON.stringify(cloudData.logs));
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [isOnline]);

  const setExchangeRate = useCallback((rate: number) => {
    setExchangeRateState(rate);
    localStorage.setItem(EXCHANGE_RATE_KEY, JSON.stringify(rate));
    supabase.from(TABLES.SETTINGS).upsert({ id: 'app_settings', exchange_rate: rate }).then(({ error }) => {
      if (error) console.error(error);
    });
  }, []);

  const saveProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
    syncProductsToSupabase(newProducts);
  }, []);

  const saveLogs = useCallback((newLogs: LogEntry[]) => {
    setLogs(newLogs);
    localStorage.setItem(LOGS_KEY, JSON.stringify(newLogs));
    syncLogsToSupabase(newLogs);
  }, []);

  const addProduct = useCallback((
    name: string,
    quantity: number,
    originalPrice: number,
    sellingPrice: number,
    category: ProductCategory,
    originalPriceUSD?: number,
    sellingPriceUSD?: number,
    specifications?: string
  ) => {
    const newProduct: Product = {
      id: generateId(),
      name,
      quantity,
      originalPrice,
      sellingPrice,
      originalPriceUSD,
      sellingPriceUSD,
      category,
      specifications,
      createdAt: formatTimestamp(),
    };

    setProducts(prev => {
      const updated = [...prev, newProduct];
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      syncProductsToSupabase(updated);
      return updated;
    });

    setLogs(prev => {
      const logEntry: LogEntry = {
        id: generateId(),
        productId: newProduct.id,
        productName: name,
        action: 'added',
        quantity,
        originalPrice,
        sellingPrice,
        originalPriceUSD,
        sellingPriceUSD,
        category,
        timestamp: formatTimestamp(),
        performedBy: currentUserRef.current,
      };
      const updated = [logEntry, ...prev];
      localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
      syncLogsToSupabase(updated);
      return updated;
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => {
      const product = prev.find(p => p.id === productId);
      if (!product) return prev;

      const updated = prev.filter(p => p.id !== productId);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      syncProductsToSupabase(updated);

      setLogs(prevLogs => {
        const logEntry: LogEntry = {
          id: generateId(),
          productId,
          productName: product.name,
          action: 'deleted',
          category: product.category,
          timestamp: formatTimestamp(),
          performedBy: currentUserRef.current,
        };
        const updatedLogs = [logEntry, ...prevLogs];
        localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
        syncLogsToSupabase(updatedLogs);
        return updatedLogs;
      });

      return updated;
    });
  }, []);

  const sellProduct = useCallback((productId: string) => {
    setProducts(prev => {
      const product = prev.find(p => p.id === productId);
      if (!product || product.quantity <= 0) return prev;

      const updated = prev.map(p =>
        p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
      );
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      syncProductsToSupabase(updated);

      setLogs(prevLogs => {
        const profit = product.sellingPrice - product.originalPrice;
        const profitUSD = (product.sellingPriceUSD || 0) - (product.originalPriceUSD || 0);
        const logEntry: LogEntry = {
          id: generateId(),
          productId,
          productName: product.name,
          action: 'sold',
          quantity: 1,
          originalPrice: product.originalPrice,
          sellingPrice: product.sellingPrice,
          originalPriceUSD: product.originalPriceUSD,
          sellingPriceUSD: product.sellingPriceUSD,
          profit,
          profitUSD,
          category: product.category,
          timestamp: formatTimestamp(),
          performedBy: currentUserRef.current,
        };
        const updatedLogs = [logEntry, ...prevLogs];
        localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
        syncLogsToSupabase(updatedLogs);
        return updatedLogs;
      });

      return updated;
    });
  }, []);

  // تسجيل خسارة
  const addLoss = useCallback((productId: string) => {
    setProducts(prev => {
      const product = prev.find(p => p.id === productId);
      if (!product || product.quantity <= 0) return prev;

      const updated = prev.map(p =>
        p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
      );
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      syncProductsToSupabase(updated);

      const lossAmount = product.originalPrice;
      const lossAmountUSD = product.originalPriceUSD || 0;

      setLogs(prevLogs => {
        const logEntry: LogEntry = {
          id: generateId(),
          productId,
          productName: product.name,
          action: 'loss',
          quantity: 1,
          lossAmount,
          lossAmountUSD,
          originalPrice: product.originalPrice,
          originalPriceUSD: product.originalPriceUSD,
          category: product.category,
          timestamp: formatTimestamp(),
          performedBy: currentUserRef.current,
        };
        const updatedLogs = [logEntry, ...prevLogs];
        localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
        syncLogsToSupabase(updatedLogs);
        return updatedLogs;
      });

      setLosses(prevLosses => {
        const lossEntry: LossEntry = {
          id: generateId(),
          productName: product.name,
          amount: lossAmount,
          amountUSD: lossAmountUSD,
          category: product.category,
          timestamp: formatTimestamp(),
          month: getCurrentMonth(),
        };
        const updatedLosses = [lossEntry, ...prevLosses];
        localStorage.setItem(LOSSES_KEY, JSON.stringify(updatedLosses));
        syncLossesToSupabase(updatedLosses);
        return updatedLosses;
      });

      return updated;
    });
  }, []);

  return {
    products,
    logs,
    losses,
    exchangeRate,
    isLoaded,
    isOnline,
    currentUser,
    addProduct,
    deleteProduct,
    sellProduct,
    addLoss,
    saveProducts,
    saveLogs,
    setExchangeRate,
    exportData: () => {
      return JSON.stringify({
        products,
        logs,
        losses,
        exchangeRate,
        exportedAt: formatTimestamp(),
      }, null, 2);
    },
    importData: (jsonString: string) => {
      try {
        const data = JSON.parse(jsonString);
        if (data.products) {
          setProducts(data.products);
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data.products));
          syncProductsToSupabase(data.products);
        }
        if (data.logs) {
          setLogs(data.logs);
          localStorage.setItem(LOGS_KEY, JSON.stringify(data.logs));
          syncLogsToSupabase(data.logs);
        }
        if (data.losses) {
          setLosses(data.losses);
          localStorage.setItem(LOSSES_KEY, JSON.stringify(data.losses));
          syncLossesToSupabase(data.losses);
        }
        if (data.exchangeRate) {
          setExchangeRateState(data.exchangeRate);
          localStorage.setItem(EXCHANGE_RATE_KEY, JSON.stringify(data.exchangeRate));
        }
        return true;
      } catch (e) {
        console.error('Import failed:', e);
        return false;
      }
    },
  };
}
