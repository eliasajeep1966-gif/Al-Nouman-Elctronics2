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

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

    const logEntry: LogEntry = {
      id: generateId(),
      productId: newProduct.id,
      productName: name,
      action: 'added',
      quantity,
      originalPrice,
      sellingPrice,
      category,
      timestamp: formatTimestamp(),
    };
    const updatedLogs = [logEntry, ...logs];
    setLogs(updatedLogs);
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
  }, [products, logs]);

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
    const logEntry: LogEntry = {
      id: generateId(),
      productId,
      productName: product.name,
      action: 'sold',
      quantity: 1,
      originalPrice: product.originalPrice,
      sellingPrice: product.sellingPrice,
      profit,
      category: product.category,
      timestamp: formatTimestamp(),
    };
    const updatedLogs = [logEntry, ...logs];
    setLogs(updatedLogs);
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
  }, [products, logs]);

  const addLoss = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) return;

    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
    );
    setProducts(updatedProducts);
    AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

    const lossAmount = product.originalPrice;

    const logEntry: LogEntry = {
      id: generateId(),
      productId,
      productName: product.name,
      action: 'loss',
      quantity: 1,
      lossAmount,
      originalPrice: product.originalPrice,
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
      category: product.category,
      timestamp: formatTimestamp(),
      month: getCurrentMonth(),
    };
    const updatedLosses = [lossEntry, ...losses];
    setLosses(updatedLosses);
    AsyncStorage.setItem(LOSSES_KEY, JSON.stringify(updatedLosses));
  }, [products, logs, losses]);

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
  };
}
