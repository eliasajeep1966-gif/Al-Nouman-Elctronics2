"use client";

import { useState, useCallback } from 'react';
import { Product, LogEntry, ProductCategory } from './types';

const PRODUCTS_KEY = 'noman_products';
const LOGS_KEY = 'noman_logs';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
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

export function useStore() {
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage<Product[]>(PRODUCTS_KEY, [])
  );
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    loadFromStorage<LogEntry[]>(LOGS_KEY, [])
  );

  const saveProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
  }, []);

  const saveLogs = useCallback((newLogs: LogEntry[]) => {
    setLogs(newLogs);
    localStorage.setItem(LOGS_KEY, JSON.stringify(newLogs));
  }, []);

  const addProduct = useCallback((
    name: string,
    quantity: number,
    originalPrice: number,
    sellingPrice: number,
    category: ProductCategory
  ) => {
    const newProduct: Product = {
      id: generateId(),
      name,
      quantity,
      originalPrice,
      sellingPrice,
      category,
      createdAt: formatTimestamp(),
    };

    setProducts(prev => {
      const updated = [...prev, newProduct];
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
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
        category,
        timestamp: formatTimestamp(),
      };
      const updated = [logEntry, ...prev];
      localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => {
      const product = prev.find(p => p.id === productId);
      if (!product) return prev;

      const updated = prev.filter(p => p.id !== productId);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));

      setLogs(prevLogs => {
        const logEntry: LogEntry = {
          id: generateId(),
          productId,
          productName: product.name,
          action: 'deleted',
          category: product.category,
          timestamp: formatTimestamp(),
        };
        const updatedLogs = [logEntry, ...prevLogs];
        localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
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

      setLogs(prevLogs => {
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
        const updatedLogs = [logEntry, ...prevLogs];
        localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
        return updatedLogs;
      });

      return updated;
    });
  }, []);

  return {
    products,
    logs,
    isLoaded: true,
    addProduct,
    deleteProduct,
    sellProduct,
    saveProducts,
    saveLogs,
  };
}
