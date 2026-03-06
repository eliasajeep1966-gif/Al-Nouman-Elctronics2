export type ProductCategory = 'parts' | 'tools';

export interface Product {
  id: string;
  name: string;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  category: ProductCategory;
  createdAt: string;
}

export type LogAction = 'added' | 'deleted' | 'sold';

export interface LogEntry {
  id: string;
  productId: string;
  productName: string;
  action: LogAction;
  quantity?: number;
  originalPrice?: number;
  sellingPrice?: number;
  profit?: number;
  category: ProductCategory;
  timestamp: string;
}
