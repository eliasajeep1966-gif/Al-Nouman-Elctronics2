"use client";

import { useRef } from "react";
import * as XLSX from "xlsx";

interface BackupProps {
  onExport: () => void;
  onImport: (data: string) => void;
  products?: any[];
  logs?: any[];
  losses?: any[];
}

export default function BackupButtons({ onExport, onImport, products, logs, losses }: BackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    onExport();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImport(content);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // تصدير لـ Excel
  const handleExportExcel = () => {
    if (!products || products.length === 0) {
      alert("لا توجد منتجات للتصدير!");
      return;
    }

    // تحضير بيانات المنتجات
    const productsData = products.map(p => ({
      "اسم المنتج": p.name,
      "التصنيف": p.category === "parts" ? "قطع غيار" : "أدوات",
      "الكمية": p.quantity,
      "السعر الأصلي (ل.س)": p.originalPrice,
      "سعر البيع (ل.س)": p.sellingPrice,
      "السعر الأصلي ($": p.originalPriceUSD || "",
      "سعر البيع ($": p.sellingPriceUSD || "",
      "تاريخ الإضافة": p.createdAt,
    }));

    // تحضير بيانات المبيعات
    const salesData = (logs || [])
      .filter(l => l.action === "sold")
      .map(l => ({
        "المنتج": l.productName,
        "التاريخ": l.timestamp,
        "الكمية": l.quantity,
        "السعر الأصلي": l.originalPrice,
        "سعر البيع": l.sellingPrice,
        "الربح": l.profit,
      }));

    // تحضير بيانات الخسائر
    const lossesData = (losses || []).map(l => ({
      "المنتج": l.productName,
      "التاريخ": l.timestamp,
      "المبلغ": l.amount,
      "الشهر": l.month,
    }));

    // إنشاء ملف Excel
    const wb = XLSX.utils.book_new();

    if (productsData.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(wb, ws1, "المنتجات");
    }

    if (salesData.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, ws2, "المبيعات");
    }

    if (lossesData.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(lossesData);
      XLSX.utils.book_append_sheet(wb, ws3, "الخسائر");
    }

    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `noman-export-${timestamp}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl text-sm font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        نسخ إحتياطي
      </button>
      <button
        onClick={handleImportClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl text-sm font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        استعادة
      </button>
      <button
        onClick={handleExportExcel}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-sm font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>
    </div>
  );
}
