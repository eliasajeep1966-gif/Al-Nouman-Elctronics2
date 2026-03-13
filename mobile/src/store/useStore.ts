import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { Product, LogEntry, LossEntry, ProductCategory } from '../types';
import { supabase, TABLES } from '../lib/supabase';

const PRODUCTS_FILE = (FileSystem.documentDirectory || '') + 'products.json';
const LOGS_FILE = (FileSystem.documentDirectory || '') + 'logs.json';
const LOSSES_FILE = (FileSystem.documentDirectory || '') + 'losses.json';
const SETTINGS_FILE = (FileSystem.documentDirectory || '') + 'settings.json';

// Keys for AsyncStorage fallback
const PRODUCTS_KEY = '@noman_products';
const LOGS_KEY = '@noman_logs';
const LOSSES_KEY = '@noman_losses';
const EXCHANGE_RATE_KEY = '@noman_exchange_rate';

export const DEFAULT_USD_TO_SYP = 14000;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTimestamp(): string {
  const now = new Date();
  if (!now) return '';
  return now.toLocaleString('en-GB', {
    timeZone: 'Asia/Damascus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) || '';
}

function getCurrentMonth(): string {
  const now = new Date();
  if (!now) return '';
  try {
    const damascusDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Damascus' }));
    return `${damascusDate.getFullYear()}-${String(damascusDate.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

// File-based storage functions - Using legacy API to avoid deprecation warnings
import { EncodingType } from 'expo-file-system/legacy';

async function saveToFile<T>(filePath: string, data: T): Promise<void> {
  try {
    if (!filePath || !FileSystem.documentDirectory) {
      throw new Error('Invalid file path');
    }
    const jsonString = JSON.stringify(data);
    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: EncodingType.UTF8,
    });
  } catch (e) {
    console.error('Error saving to file:', e);
    // Fallback to AsyncStorage
    try {
      const key = filePath.includes('products') ? PRODUCTS_KEY : 
                  filePath.includes('logs') ? LOGS_KEY : 
                  filePath.includes('losses') ? LOSSES_KEY : 'unknown';
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (asyncError) {
      console.error('AsyncStorage fallback error:', asyncError);
    }
  }
}

async function loadFromFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(filePath, {
        encoding: EncodingType.UTF8,
      });
      return JSON.parse(content) as T;
    }
  } catch (e) {
    console.log('File not found or error, trying AsyncStorage:', e);
  }
  
  // Fallback to AsyncStorage
  try {
    const key = filePath === PRODUCTS_FILE ? PRODUCTS_KEY : 
                filePath === LOGS_FILE ? LOGS_KEY : 
                filePath === LOSSES_FILE ? LOSSES_KEY : null;
    if (key) {
      const stored = await AsyncStorage.getItem(key);
      if (stored) return JSON.parse(stored) as T;
    }
  } catch (asyncError) {
    console.error('AsyncStorage fallback read error:', asyncError);
  }
  
  return fallback;
}

// Sync local data to Supabase
async function syncProductsToSupabase(products: Product[], userId?: string) {
  try {
    const { data, error } = await supabase.from(TABLES.PRODUCTS).upsert(
      products.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        original_price: p.originalPrice,
        selling_price: p.sellingPrice,
        original_price_usd: p.originalPriceUSD,
        selling_price_usd: p.sellingPriceUSD,
        category: p.category,
        specifications: p.specifications,
        user_id: userId || p.userId,
        created_at: p.createdAt,
      }))
    ).select();
    
    if (error) {
      console.error('Supabase products upsert error:', error);
    } else {
      console.log('Products synced to Supabase successfully:', data?.length || 0, 'items');
    }
  } catch (e) {
    console.error('Error syncing products to Supabase:', e);
  }
}

async function syncLogsToSupabase(logs: LogEntry[]) {
  try {
    const { data, error } = await supabase.from(TABLES.LOGS).upsert(
      logs.map(l => ({
        id: l.id,
        product_id: l.productId,
        product_name: l.productName,
        action: l.action,
        quantity: l.quantity,
        original_price: l.originalPrice,
        selling_price: l.sellingPrice,
        original_price_usd: l.originalPriceUSD,
        selling_price_usd: l.sellingPriceUSD,
        profit: l.profit,
        profit_usd: l.profitUSD,
        loss_amount: l.lossAmount,
        loss_amount_usd: l.lossAmountUSD,
        category: l.category,
        timestamp: l.timestamp,
      }))
    ).select();
    
    if (error) {
      console.error('Supabase logs upsert error:', error);
    } else {
      console.log('Logs synced to Supabase successfully:', data?.length || 0, 'items');
    }
  } catch (e) {
    console.error('Error syncing logs to Supabase:', e);
  }
}

async function syncLossesToSupabase(losses: LossEntry[]) {
  try {
    const { data, error } = await supabase.from(TABLES.LOSSES).upsert(
      losses.map(l => ({
        id: l.id,
        product_name: l.productName,
        amount: l.amount,
        amount_usd: l.amountUSD,
        category: l.category,
        timestamp: l.timestamp,
        month: l.month,
      }))
    ).select();
    
    if (error) {
      console.error('Supabase losses upsert error:', error);
    } else {
      console.log('Losses synced to Supabase successfully:', data?.length || 0, 'items');
    }
  } catch (e) {
    console.error('Error syncing losses to Supabase:', e);
  }
}

const LOW_STOCK_THRESHOLD = 2;

async function sendNotification(title: string, body: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch (e) {
    console.error('Error sending notification:', e);
  }
}

function checkLowStock(products: Product[]): Product[] {
  return products.filter(p => p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD);
}

// Load data from Supabase first, fallback to local files
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
      sellingPriceUSD: p.original_price_usd,
      category: p.category as ProductCategory,
      specifications: p.specifications,
      userId: p.user_id,
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
      category: l.category as ProductCategory,
      timestamp: l.timestamp,
    }));

    const losses: LossEntry[] = (lossesRes.data || []).map(l => ({
      id: l.id,
      productName: l.product_name,
      amount: l.amount,
      amountUSD: l.amount_usd,
      category: l.category as ProductCategory,
      timestamp: l.timestamp,
      month: l.month,
    }));

    const exchangeRate = settingsRes.data?.exchange_rate || DEFAULT_USD_TO_SYP;

    // Save to file storage as primary, AsyncStorage as backup
    if (products.length > 0) {
      await saveToFile(PRODUCTS_FILE, products);
    }
    if (logs.length > 0) {
      await saveToFile(LOGS_FILE, logs);
    }
    if (losses.length > 0) {
      await saveToFile(LOSSES_FILE, losses);
    }
    await saveToFile(SETTINGS_FILE, { exchangeRate });

    return { products, logs, losses, exchangeRate, fromCloud: true };
  } catch (e) {
    console.error('Error loading from Supabase:', e);
    return null;
  }
}

export function useStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [losses, setLosses] = useState<LossEntry[]>([]);
  const [exchangeRate, setExchangeRateState] = useState<number>(DEFAULT_USD_TO_SYP);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstLoad = useRef(true);

  // تحميل البيانات - الأول من الملفات المحلية ثم Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // First, load from local files (Offline-First)
        const [localProducts, localLogs, localLosses, localSettings] = await Promise.all([
          loadFromFile<Product[]>(PRODUCTS_FILE, []),
          loadFromFile<LogEntry[]>(LOGS_FILE, []),
          loadFromFile<LossEntry[]>(LOSSES_FILE, []),
          loadFromFile<{ exchangeRate?: number }>(SETTINGS_FILE, { exchangeRate: DEFAULT_USD_TO_SYP }),
        ]);

        if (localProducts.length > 0) {
          setProducts(localProducts);
          setLogs(localLogs);
          setLosses(localLosses);
          setExchangeRateState(localSettings.exchangeRate || DEFAULT_USD_TO_SYP);
        }

        // Then try to sync with Supabase if online
        const networkStatus = await fetch('https://www.google.com', { method: 'HEAD' })
          .then(() => true)
          .catch(() => false);
        setIsOnline(networkStatus);

        if (networkStatus) {
          const cloudData = await loadFromSupabase();
          if (cloudData && cloudData.products.length > 0) {
            setProducts(cloudData.products);
            setLogs(cloudData.logs);
            setLosses(cloudData.losses);
            setExchangeRateState(cloudData.exchangeRate);
          }
        }
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setIsLoaded(true);
        isFirstLoad.current = false;
      }
    };
    loadData();
  }, []);

  // Network status detection and periodic sync
  useEffect(() => {
    // Check network status
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-cache' });
        const online = response.ok;
        setIsOnline(online);
        
        if (online && products.length > 0) {
          // Sync to Supabase when back online
          syncProductsToSupabase(products);
          syncLogsToSupabase(logs);
          syncLossesToSupabase(losses);
        }
      } catch {
        setIsOnline(false);
      }
    };

    // Initial check
    checkNetwork();

    // Periodic sync every 10 seconds
    syncIntervalRef.current = setInterval(() => {
      checkNetwork();
    }, 10000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [products, logs, losses]);

  // Save to files whenever data changes (after initial load)
  useEffect(() => {
    if (!isFirstLoad.current && isLoaded) {
      saveToFile(PRODUCTS_FILE, products);
      saveToFile(LOGS_FILE, logs);
      saveToFile(LOSSES_FILE, losses);
      saveToFile(SETTINGS_FILE, { exchangeRate });
    }
  }, [products, logs, losses, exchangeRate, isLoaded]);

  const setExchangeRate = useCallback(async (rate: number) => {
    setExchangeRateState(rate);
    await saveToFile(SETTINGS_FILE, { exchangeRate: rate });
    // Sync to Supabase
    try {
      await supabase.from(TABLES.SETTINGS).upsert({
        id: 'app_settings',
        exchange_rate: rate,
      });
    } catch (e) {
      console.error('Error syncing exchange rate:', e);
    }
  }, []);

  // دالة إضافة منتج - USD كمدخل رئيسي
  const addProduct = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (name: string, quantity: number, originalPriceUSD: number, sellingPriceUSD: number, category: ProductCategory, specifications?: string, _userId?: string) => {
    const originalPriceSYP = Math.round(originalPriceUSD * exchangeRate);
    const sellingPriceSYP = Math.round(sellingPriceUSD * exchangeRate);

    const newProduct: Product = {
      id: generateId(),
      name,
      quantity,
      originalPrice: originalPriceSYP,
      sellingPrice: sellingPriceSYP,
      originalPriceUSD,
      sellingPriceUSD,
      category,
      specifications,
      userId: _userId,
      createdAt: formatTimestamp(),
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);

    // Save to file
    saveToFile(PRODUCTS_FILE, updatedProducts);

    // Sync to Supabase if online
    if (isOnline) {
      syncProductsToSupabase(updatedProducts);
    }

    const logEntry: LogEntry = {
      id: generateId(),
      productId: newProduct.id,
      productName: name,
      action: 'added',
      quantity,
      originalPrice: originalPriceSYP,
      sellingPrice: sellingPriceSYP,
      originalPriceUSD,
      sellingPriceUSD,
      category,
      timestamp: formatTimestamp(),
    };
    const updatedLogs = [logEntry, ...logs];
    setLogs(updatedLogs);
    saveToFile(LOGS_FILE, updatedLogs);
    
    // Sync logs to Supabase if online
    if (isOnline) {
      syncLogsToSupabase(updatedLogs);
    }

    // Send notification
    sendNotification('➕ منتج جديد مضاف', `${name} - ${quantity} وحدة`);
    
    // Check low stock
    const lowStockItems = checkLowStock(updatedProducts);
    if (lowStockItems.length > 0) {
      sendNotification('⚠️ تنبيه مخزون منخفض', `${lowStockItems.length} منتجات تحت ${LOW_STOCK_THRESHOLD} وحدة`);
    }
  }, [products, logs, exchangeRate, isOnline]);

  const deleteProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    saveToFile(PRODUCTS_FILE, updatedProducts);
    
    // Sync to Supabase if online
    if (isOnline) {
      syncProductsToSupabase(updatedProducts);
    }

    const logEntry: LogEntry = {
      id: generateId(),
      productId,
      productName: product.name,
      action: 'deleted',
      category: product.category,
      timestamp: formatTimestamp(),
    };
    const updatedLogs = [logEntry, ...logs];
    setLogs(updatedLogs);
    saveToFile(LOGS_FILE, updatedLogs);
    
    // Sync logs to Supabase if online
    if (isOnline) {
      syncLogsToSupabase(updatedLogs);
    }
  }, [products, logs, isOnline]);

  const sellProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) return;

    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
    );
    setProducts(updatedProducts);
    saveToFile(PRODUCTS_FILE, updatedProducts);
    
    // Sync to Supabase if online
    if (isOnline) {
      syncProductsToSupabase(updatedProducts);
    }

    const profit = product.sellingPrice - product.originalPrice;
    const profitUSD = product.sellingPriceUSD && product.originalPriceUSD
      ? product.sellingPriceUSD - product.originalPriceUSD
      : profit / exchangeRate;

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
    };
    const updatedLogs = [logEntry, ...logs];
    setLogs(updatedLogs);
    saveToFile(LOGS_FILE, updatedLogs);
    
    // Sync logs to Supabase if online
    if (isOnline) {
      syncLogsToSupabase(updatedLogs);
    }

    // Send notification for sale
    sendNotification('💰 تم البيع', `${product.name} - ربح: ${profit.toLocaleString()} ل.س`);
    
    // Check low stock after sale
    const lowStockItems = checkLowStock(updatedProducts);
    if (lowStockItems.length > 0) {
      sendNotification('⚠️ تنبيه مخزون منخفض', `${lowStockItems.length} منتجات تحت ${LOW_STOCK_THRESHOLD} وحدة`);
    }
  }, [products, logs, exchangeRate, isOnline]);

  const addLoss = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) return;

    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
    );
    setProducts(updatedProducts);
    saveToFile(PRODUCTS_FILE, updatedProducts);
    
    // Sync to Supabase if online
    if (isOnline) {
      syncProductsToSupabase(updatedProducts);
    }

    const lossAmount = product.originalPrice;
    const lossAmountUSD = product.originalPriceUSD || lossAmount / exchangeRate;

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
    };
    const updatedLogs = [logEntry, ...logs];
    setLogs(updatedLogs);
    saveToFile(LOGS_FILE, updatedLogs);
    
    // Sync logs to Supabase if online
    if (isOnline) {
      syncLogsToSupabase(updatedLogs);
    }

    const lossEntry: LossEntry = {
      id: generateId(),
      productName: product.name,
      amount: lossAmount,
      amountUSD: lossAmountUSD,
      category: product.category,
      timestamp: formatTimestamp(),
      month: getCurrentMonth(),
    };
    const updatedLosses = [lossEntry, ...losses];
    setLosses(updatedLosses);
    saveToFile(LOSSES_FILE, updatedLosses);
    
    // Sync losses to Supabase if online
    if (isOnline) {
      syncLossesToSupabase(updatedLosses);
    }
  }, [products, logs, losses, exchangeRate, isOnline]);

  // دالة تصدير البيانات
  const exportData = useCallback(() => {
    const data = {
      products,
      logs,
      losses,
      exchangeRate,
      exportedAt: formatTimestamp(),
    };
    return JSON.stringify(data, null, 2);
  }, [products, logs, losses, exchangeRate]);

  // دالة استيراد البيانات
  const importData = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) {
        setProducts(data.products);
        saveToFile(PRODUCTS_FILE, data.products);
        if (isOnline) syncProductsToSupabase(data.products);
      }
      if (data.logs) {
        setLogs(data.logs);
        saveToFile(LOGS_FILE, data.logs);
        if (isOnline) syncLogsToSupabase(data.logs);
      }
      if (data.losses) {
        setLosses(data.losses);
        saveToFile(LOSSES_FILE, data.losses);
        if (isOnline) syncLossesToSupabase(data.losses);
      }
      if (data.exchangeRate) {
        setExchangeRateState(data.exchangeRate);
        saveToFile(SETTINGS_FILE, { exchangeRate: data.exchangeRate });
      }
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }, [isOnline]);

  // حذف كل البيانات
  const clearAllData = useCallback(async () => {
    setProducts([]);
    setLogs([]);
    setLosses([]);
    
    // Clear files
    try {
      await FileSystem.deleteAsync(PRODUCTS_FILE, { idempotent: true });
      await FileSystem.deleteAsync(LOGS_FILE, { idempotent: true });
      await FileSystem.deleteAsync(LOSSES_FILE, { idempotent: true });
      await FileSystem.deleteAsync(SETTINGS_FILE, { idempotent: true });
    } catch (e) {
      console.error('Error deleting files:', e);
    }
    
    // Also clear AsyncStorage
    await AsyncStorage.multiRemove([PRODUCTS_KEY, LOGS_KEY, LOSSES_KEY, EXCHANGE_RATE_KEY]);
    
    // Clear from Supabase
    if (isOnline) {
      try {
        await supabase.from(TABLES.PRODUCTS).delete().neq('id', '');
        await supabase.from(TABLES.LOGS).delete().neq('id', '');
        await supabase.from(TABLES.LOSSES).delete().neq('id', '');
      } catch (e) {
        console.error('Error clearing Supabase data:', e);
      }
    }
  }, [isOnline]);

  return {
    products,
    logs,
    losses,
    exchangeRate,
    isLoaded,
    isOnline,
    addProduct,
    deleteProduct,
    sellProduct,
    addLoss,
    setExchangeRate,
    exportData,
    importData,
    clearAllData,
  };
}
