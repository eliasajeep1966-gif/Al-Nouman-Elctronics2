import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, LogEntry, LossEntry, ProductCategory } from '../types';

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

export function useStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [losses, setLosses] = useState<LossEntry[]>([]);
  const [exchangeRate, setExchangeRateState] = useState<number>(DEFAULT_USD_TO_SYP);
  const [isLoaded, setIsLoaded] = useState(false);

  // تحميل البيانات من AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedProducts, storedLogs, storedLosses, storedRate] = await Promise.all([
          AsyncStorage.getItem(PRODUCTS_KEY),
          AsyncStorage.getItem(LOGS_KEY),
          AsyncStorage.getItem(LOSSES_KEY),
          AsyncStorage.getItem(EXCHANGE_RATE_KEY),
        ]);

        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedLogs) setLogs(JSON.parse(storedLogs));
        if (storedLosses) setLosses(JSON.parse(storedLosses));
        if (storedRate) setExchangeRateState(JSON.parse(storedRate));
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const setExchangeRate = useCallback(async (rate: number) => {
    setExchangeRateState(rate);
    await AsyncStorage.setItem(EXCHANGE_RATE_KEY, JSON.stringify(rate));
  }, []);

  // دالة إضافة منتج - USD كمدخل رئيسي (مثل الموقع)
  const addProduct = useCallback((
    name: string,
    quantity: number,
    originalPriceUSD: number,
    sellingPriceUSD: number,
    category: ProductCategory,
    specifications?: string
  ) => {
    // تحويل من دولار إلى ليرة
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
      createdAt: formatTimestamp(),
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

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
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
  }, [products, logs, exchangeRate]);

  const deleteProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

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
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
  }, [products, logs]);

  const sellProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) return;

    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
    );
    setProducts(updatedProducts);
    AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

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
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
  }, [products, logs, exchangeRate]);

  const addLoss = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) return;

    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
    );
    setProducts(updatedProducts);
    AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

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
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));

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
    AsyncStorage.setItem(LOSSES_KEY, JSON.stringify(updatedLosses));
  }, [products, logs, losses, exchangeRate]);

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
        AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(data.products));
      }
      if (data.logs) {
        setLogs(data.logs);
        AsyncStorage.setItem(LOGS_KEY, JSON.stringify(data.logs));
      }
      if (data.losses) {
        setLosses(data.losses);
        AsyncStorage.setItem(LOSSES_KEY, JSON.stringify(data.losses));
      }
      if (data.exchangeRate) {
        setExchangeRateState(data.exchangeRate);
        AsyncStorage.setItem(EXCHANGE_RATE_KEY, JSON.stringify(data.exchangeRate));
      }
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }, []);

  // حذف كل البيانات
  const clearAllData = useCallback(async () => {
    setProducts([]);
    setLogs([]);
    setLosses([]);
    await AsyncStorage.multiRemove([PRODUCTS_KEY, LOGS_KEY, LOSSES_KEY]);
  }, []);

  return {
    products,
    logs,
    losses,
    exchangeRate,
    isLoaded,
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
