export type ProductCategory = 'parts' | 'tools';

export interface Product {
  id: string;
  name: string;
  quantity: number;
  originalPrice: number;    // بالليرة السورية
  sellingPrice: number;     // بالليرة السورية
  originalPriceUSD?: number; // بالدولار (اختياري)
  sellingPriceUSD?: number;  // بالدولار (اختياري)
  category: ProductCategory;
  specifications?: string; // مواصفات المنتج (اختياري)
  createdAt: string;
}

export type LogAction = 'added' | 'deleted' | 'sold' | 'loss';

export interface LogEntry {
  id: string;
  productId: string;
  productName: string;
  action: LogAction;
  quantity?: number;
  originalPrice?: number;
  sellingPrice?: number;
  originalPriceUSD?: number;
  sellingPriceUSD?: number;
  profit?: number;
  profitUSD?: number;
  lossAmount?: number;  // مبلغ الخسارة
  lossAmountUSD?: number;
  category: ProductCategory;
  timestamp: string;
}

export interface LossEntry {
  id: string;
  productName: string;
  amount: number;
  amountUSD?: number;
  category: ProductCategory;
  timestamp: string;
  month: string; // YYYY-MM
}
