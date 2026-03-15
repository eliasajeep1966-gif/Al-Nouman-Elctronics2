import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Share,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Product, TabId, LogEntry, LossEntry } from '../types';

type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: { category: 'parts' | 'tools' };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProductList'>;
  products: Product[];
  exchangeRate: number;
  logs: LogEntry[];
  losses: LossEntry[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAdd: (name: string, quantity: number, originalPriceUSD: number, sellingPriceUSD: number, category: 'parts' | 'tools', specifications?: string) => void;
  onSell: (id: string) => void;
  onDelete: (id: string) => void;
  onLoss: (id: string) => void;
  onSetExchangeRate: (rate: number) => void;
  onClearAll: () => void;
  onExportData: () => string;
  onImportData: (json: string) => boolean;
  userId: string;
  userEmail?: string | null;
  onLogout: () => void;
  isOnline: boolean;
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'parts', label: 'قطع الغيار', icon: '⚙️' },
  { id: 'tools', label: 'الأدوات', icon: '🖥️' },
  { id: 'profits', label: 'الأرباح', icon: '📊' },
  { id: 'log', label: 'السجل', icon: '📋' },
];

// Dark Blue & Black Theme with Gold Accents
const COLORS = {
  gradientStart: '#0A192F',
  gradientEnd: '#000000',
  cardBg: 'rgba(20, 30, 55, 0.85)',
  cardBorder: 'rgba(212, 175, 55, 0.2)',
  white: '#ffffff',
  gold: '#D4AF37',
  goldLight: '#F5D042',
  blueMuted: '#94A3B8',
  green: '#10B981',
  red: '#EF4444',
  blue: '#3B82F6',
};

function getMonthLabel(month: string): string {
  if (!month) return '';
  const parts = month.split('-');
  if (parts.length < 2) return '';
  const [year, m] = parts;
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-SY', { month: 'long', year: 'numeric' }) || '';
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

export default function ProductListScreen({ 
  navigation, 
  products, 
  exchangeRate,
  logs,
  losses,
  isDarkMode,
  onToggleDarkMode,
  onAdd,
  onSell,
  onDelete,
  onLoss,
  onSetExchangeRate,
  onClearAll,
  onExportData,
  onImportData,
  userId,
  userEmail,
  onLogout,
  isOnline,
}: Props) {
  // استخراج اسم المستخدم من الإيميل
  const username = userEmail ? userEmail.split('@')[0] : '';
  
  const [activeTab, setActiveTab] = useState<TabId>('parts');
  const [search, setSearch] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinQuantity, setFilterMinQuantity] = useState('');
  const [filterMaxQuantity, setFilterMaxQuantity] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    if (!now) return '';
    try {
      const damascus = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Damascus' }));
      if (!damascus || isNaN(damascus.getTime())) return '';
      return `${damascus.getFullYear()}-${String(damascus.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return '';
    }
  });

  // تصفية المنتجات حسب الفئة
  const categoryProducts = useMemo(() => {
    if (activeTab === 'parts') return products.filter(p => p.category === 'parts');
    if (activeTab === 'tools') return products.filter(p => p.category === 'tools');
    return [];
  }, [products, activeTab]);

  // البحث والفلترة المتقدمة
  const filteredProducts = useMemo(() => {
    let result = categoryProducts;
    
    // البحث النصي
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    
    // فلترة حسب السعر الأدنى
    if (filterMinPrice.trim()) {
      const minPrice = parseFloat(filterMinPrice);
      if (!isNaN(minPrice)) {
        result = result.filter(p => p.sellingPrice >= minPrice);
      }
    }
    
    // فلترة حسب السعر الأعلى
    if (filterMaxPrice.trim()) {
      const maxPrice = parseFloat(filterMaxPrice);
      if (!isNaN(maxPrice)) {
        result = result.filter(p => p.sellingPrice <= maxPrice);
      }
    }
    
    // فلترة حسب الكمية الأدنى
    if (filterMinQuantity.trim()) {
      const minQty = parseInt(filterMinQuantity);
      if (!isNaN(minQty)) {
        result = result.filter(p => p.quantity >= minQty);
      }
    }
    
    // فلترة حسب الكمية الأعلى
    if (filterMaxQuantity.trim()) {
      const maxQty = parseInt(filterMaxQuantity);
      if (!isNaN(maxQty)) {
        result = result.filter(p => p.quantity <= maxQty);
      }
    }
    
    return result;
  }, [categoryProducts, search, filterMinPrice, filterMaxPrice, filterMinQuantity, filterMaxQuantity]);

  // حساب الإحصائيات
  const totalProducts = categoryProducts.length;
  const totalItems = categoryProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalProfit = categoryProducts.reduce((sum, p) => sum + (p.sellingPrice - p.originalPrice) * p.quantity, 0);
  const totalProfitUSD = totalProfit / exchangeRate;
  const totalCost = categoryProducts.reduce((sum, p) => sum + p.originalPrice * p.quantity, 0);
  const totalCostUSD = totalCost / exchangeRate;

  // حساب أرباح الشهر المحدد
  const monthlyData = useMemo(() => {
    const soldLogs = logs.filter(log => {
      if (log.action !== 'sold') return false;
      try {
        const parts = log.timestamp.split('/');
        if (parts.length >= 3) {
          const year = parts[2].split(',')[0].trim();
          const month = parts[1].padStart(2, '0');
          return `${year}-${month}` === selectedMonth;
        }
      } catch { return false; }
      return false;
    });

    const partsProfit = soldLogs.filter(l => l.category === 'parts').reduce((sum, l) => sum + (l.profit ?? 0), 0);
    const toolsProfit = soldLogs.filter(l => l.category === 'tools').reduce((sum, l) => sum + (l.profit ?? 0), 0);

    const monthLosses = losses.filter(l => l.month === selectedMonth);
    const partsLosses = monthLosses.filter(l => l.category === 'parts');
    const toolsLosses = monthLosses.filter(l => l.category === 'tools');
    const totalPartsLoss = partsLosses.reduce((sum, l) => sum + l.amount, 0);
    const totalToolsLoss = toolsLosses.reduce((sum, l) => sum + l.amount, 0);

    return {
      partsProfit,
      toolsProfit,
      partsLosses,
      toolsLosses,
      totalPartsLoss,
      totalToolsLoss,
      netPartsProfit: partsProfit - totalPartsLoss,
      netToolsProfit: toolsProfit - totalToolsLoss,
      totalNet: (partsProfit - totalPartsLoss) + (toolsProfit - totalToolsLoss),
      soldCount: soldLogs.length,
    };
  }, [logs, losses, selectedMonth]);

  // الأشهر المتاحة
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonth);
    logs.forEach(log => {
      if (log.action === 'sold' && log.timestamp) {
        try {
          const parts = log.timestamp.split('/');
          if (parts.length >= 3) {
            const year = parts[2].split(',')[0].trim();
            const month = parts[1].padStart(2, '0');
            months.add(`${year}-${month}`);
          }
        } catch {}
      }
    });
    losses.forEach(l => { if (l.month) months.add(l.month); });
    return Array.from(months).sort().reverse();
  }, [logs, losses]);

  const handleRateSubmit = () => {
    const rate = parseFloat(rateInput) || 14000;
    if (rate > 0) {
      onSetExchangeRate(rate);
      setEditingRate(false);
    }
  };

  const handleShare = async () => {
    try {
      const data = onExportData();
      await Share.share({ message: data, title: 'نسخ احتياطي - إلكترونيات النعمان' });
    } catch (error) {
      Alert.alert('خطأ', 'فشل في المشاركة');
    }
  };

  const handleNewMonth = () => {
    Alert.prompt(
      'شهر جديد',
      'أدخل الشهر الجديد (格式: YYYY-MM, مثال: 2026-04)',
      (input) => {
        if (input && /^\d{4}-\d{2}$/.test(input)) {
          setSelectedMonth(input);
        } else {
          Alert.alert('خطأ', 'الرجاء إدخال التاريخ بالتنسيق الصحيح');
        }
      },
      'plain-text',
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    );
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const profit = item.sellingPrice - item.originalPrice;
    const profitPercent = item.originalPrice > 0 ? ((profit / item.originalPrice) * 100).toFixed(1) : '0';
    const originalUSD = item.originalPriceUSD ?? (item.originalPrice / exchangeRate);
    const sellingUSD = item.sellingPriceUSD ?? (item.sellingPrice / exchangeRate);
    const profitUSD = sellingUSD - originalUSD;
    const isOutOfStock = item.quantity === 0;
    const isLowStock = item.quantity > 0 && item.quantity <= 3;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productDate}>{item.createdAt}</Text>
          </View>
          <View style={[styles.stockBadge, isOutOfStock && styles.stockOut, isLowStock && styles.stockLow, !isOutOfStock && !isLowStock && styles.stockOk]}>
            <Text style={[styles.stockText, isOutOfStock && styles.stockTextOut, isLowStock && styles.stockTextLow]}>
              {isOutOfStock ? 'نفد' : `${item.quantity} قطعة`}
            </Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>الأصلي/قطعة</Text>
            <Text style={styles.priceUSD}>${originalUSD.toFixed(2)}</Text>
            <Text style={styles.priceSYP}>{item.originalPrice.toLocaleString('en-US')} ل.س</Text>
          </View>
          <View style={[styles.priceBox, { backgroundColor: COLORS.blue }]}>
            <Text style={styles.priceLabelWhite}>سعر البيع</Text>
            <Text style={styles.priceUSDWhite}>${sellingUSD.toFixed(2)}</Text>
            <Text style={styles.priceSYPWhite}>{item.sellingPrice.toLocaleString('en-US')} ل.س</Text>
          </View>
          <View style={[styles.priceBox, profit >= 0 ? styles.profitBox : styles.lossBox]}>
            <Text style={[styles.priceLabel, { color: profit >= 0 ? COLORS.green : COLORS.red }]}>الربح</Text>
            <Text style={[styles.priceUSD, { color: profit >= 0 ? COLORS.green : COLORS.red }]}>
              {profitUSD >= 0 ? '+' : ''}${profitUSD.toFixed(2)}
            </Text>
            <Text style={[styles.priceSYP, { color: profit >= 0 ? COLORS.green : COLORS.red }]}>{profitPercent}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => {
    const actionColors: Record<string, { bg: string; text: string }> = {
      added: { bg: '#dcfce7', text: '#16a34a' },
      sold: { bg: '#dbeafe', text: '#2563eb' },
      loss: { bg: '#fef3c7', text: '#d97706' },
      deleted: { bg: '#fee2e2', text: '#dc2626' },
    };
    const colors = actionColors[item.action] || { bg: '#f1f5f9', text: '#64748b' };

    const actionLabels: Record<string, string> = {
      added: '➕ أضيف',
      sold: '💰 بيع',
      loss: '📉 خسارة',
      deleted: '🗑️ حذف',
    };

    const categoryLabels: Record<string, string> = {
      parts: '🔧 غيار',
      tools: '🖥️ أدوات',
    };

    return (
      <View style={[styles.logItem, { backgroundColor: colors.bg }]}>
        <View style={styles.logHeader}>
          <View style={styles.logHeaderTop}>
            <Text style={[styles.logAction, { color: colors.text }]}>{actionLabels[item.action] || item.action}</Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={[styles.categoryText, { color: item.category === 'parts' ? '#f97316' : '#6366f1' }]}>
                  {categoryLabels[item.category]}
                </Text>
              </View>
            )}
            {item.performedBy && (
              <View style={styles.userBadge}>
                <Text style={styles.userBadgeText}>@{item.performedBy.split('@')[0]}</Text>
              </View>
            )}
          </View>
          <Text style={styles.logTime}>{item.timestamp}</Text>
        </View>
        <Text style={styles.logProduct}>{item.productName}</Text>
        {item.quantity && <Text style={styles.logQty}>الكمية: {item.quantity}</Text>}
        {item.profit != null && item.profit > 0 && (
          <Text style={[styles.logProfit, { color: COLORS.green }]}>💵 ربح: {(item.profit || 0).toLocaleString('en-US')} ل.س</Text>
        )}
        {item.lossAmount != null && (
          <Text style={[styles.logLoss, { color: COLORS.red }]}>📉 خسارة: {(item.lossAmount || 0).toLocaleString('en-US')} ل.س</Text>
        )}
      </View>
    );
  };

  const fmt = (n: number) => n.toLocaleString('en-US');
  const fmtUSD = (n: number) => `$${(n / exchangeRate).toFixed(2)}`;

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
        
        {/* Header */}
        <View style={styles.header}>
          {/* Top Section */}
          <View style={styles.headerTop}>
            <View style={styles.userSection}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>👤</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userGreeting}>Hi, {username || 'Elias'}</Text>
                <Text style={styles.userStatus}>{isOnline ? 'متصل' : 'غير متصل'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>${totalProfitUSD.toFixed(0)} USD</Text>
            <Text style={[styles.balanceChange, { color: totalProfit >= 0 ? COLORS.green : COLORS.red }]}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('en-US')} ل.س
            </Text>
          </View>

          {/* Exchange Rate */}
          <TouchableOpacity style={styles.exchangeButton} onPress={() => { setRateInput(exchangeRate.toString()); setEditingRate(true); }}>
            <Text style={styles.exchangeButtonText}>💵 {exchangeRate.toLocaleString('en-US')} ل.س/$</Text>
          </TouchableOpacity>

          {editingRate && (
            <View style={styles.rateEdit}>
              <TextInput style={styles.rateInput} value={rateInput} onChangeText={setRateInput} keyboardType="numeric" placeholder="سعر الصرف" autoFocus />
              <TouchableOpacity style={styles.rateSaveButton} onPress={handleRateSubmit}><Text style={styles.rateSaveText}>✓</Text></TouchableOpacity>
              <TouchableOpacity style={styles.rateCancelButton} onPress={() => setEditingRate(false)}><Text style={styles.rateCancelText}>✕</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Parts/Tools Content */}
        {(activeTab === 'parts' || activeTab === 'tools') && (
          <>
            <View style={styles.statsBar}>
              <View style={styles.statItem}><Text style={styles.statLabel}>المنتجات</Text><Text style={styles.statValue}>{totalProducts}</Text></View>
              <View style={styles.statItem}><Text style={styles.statLabel}>إجمالي القطع</Text><Text style={styles.statValue}>{totalItems}</Text></View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>الربح المتوقع</Text>
                <Text style={[styles.statValue, totalProfit >= 0 ? styles.statValueGreen : styles.statValueRed]}>${totalProfitUSD.toFixed(0)}</Text>
                <Text style={[styles.statValue, totalProfit >= 0 ? styles.statValueGreen : styles.statValueRed, { fontSize: 12 }]}>{totalProfit.toLocaleString('en-US')} ل.س</Text>
              </View>
            </View>

            {showBalance && (
              <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}><Text style={styles.balanceTitle}>💰 الرصيد</Text><TouchableOpacity onPress={() => setShowBalance(false)}><Text style={styles.balanceClose}>✕</Text></TouchableOpacity></View>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceItem}><Text style={styles.balanceLabel}>دولار</Text><Text style={styles.balanceValue}>${totalCostUSD.toFixed(2)}</Text></View>
                  <View style={styles.balanceItem}><Text style={styles.balanceLabel}>ليرة</Text><Text style={styles.balanceValue}>{totalCost.toLocaleString('en-US')} ل.س</Text></View>
                </View>
              </View>
            )}

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder={`البحث...`} placeholderTextColor={COLORS.blueMuted} />
              </View>
              <TouchableOpacity style={styles.balanceToggle} onPress={() => setShowFilters(!showFilters)}>
                <Text style={styles.balanceToggleText}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.balanceToggle} onPress={() => setShowBalance(!showBalance)}><Text style={styles.balanceToggleText}>💰</Text></TouchableOpacity>
            </View>

            {showFilters && (
              <View style={styles.filtersContainer}>
                <Text style={styles.filterTitle}>فلترة متقدمة:</Text>
                <View style={styles.filterRow}>
                  <TextInput style={styles.filterInput} value={filterMinPrice} onChangeText={setFilterMinPrice} placeholder="السعر من (ل.س)" placeholderTextColor={COLORS.blueMuted} keyboardType="numeric" />
                  <TextInput style={styles.filterInput} value={filterMaxPrice} onChangeText={setFilterMaxPrice} placeholder="السعر إلى (ل.س)" placeholderTextColor={COLORS.blueMuted} keyboardType="numeric" />
                </View>
                <View style={styles.filterRow}>
                  <TextInput style={styles.filterInput} value={filterMinQuantity} onChangeText={setFilterMinQuantity} placeholder="الكمية من" placeholderTextColor={COLORS.blueMuted} keyboardType="numeric" />
                  <TextInput style={styles.filterInput} value={filterMaxQuantity} onChangeText={setFilterMaxQuantity} placeholder="الكمية إلى" placeholderTextColor={COLORS.blueMuted} keyboardType="numeric" />
                </View>
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={() => { setFilterMinPrice(''); setFilterMaxPrice(''); setFilterMinQuantity(''); setFilterMaxQuantity(''); }}>
                  <Text style={styles.clearFiltersText}>مسح الفلاتر</Text>
                </TouchableOpacity>
              </View>
            )}

            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}><Text style={styles.emptyText}>لا توجد منتجات</Text></View>
            ) : (
              <FlatList data={filteredProducts} renderItem={renderProduct} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProduct', { category: activeTab === 'parts' ? 'parts' : 'tools' })}>
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Profits Tab - Monthly Details */}
        {activeTab === 'profits' && (
          <ScrollView style={styles.profitsContainer}>
            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <View style={styles.monthSelectorRow}>
                <Text style={styles.monthLabel}>الشهر:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthsScroll}>
                  {availableMonths.map(month => (
                    <TouchableOpacity key={month} style={[styles.monthBtn, selectedMonth === month && styles.monthBtnActive]} onPress={() => setSelectedMonth(month)}>
                      <Text style={[styles.monthBtnText, selectedMonth === month && styles.monthBtnTextActive]}>{getMonthLabel(month)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Parts Profit */}
            <View style={styles.profitCard}>
              <View style={styles.profitCardHeader}><Text style={styles.profitCardIcon}>⚙️</Text><Text style={styles.profitCardTitle}>صافي أرباح قطع الغيار</Text></View>
              <View style={styles.profitGrid}>
                <View style={[styles.profitGridItem, { backgroundColor: '#dcfce7' }]}><Text style={[styles.profitGridLabel, { color: '#16a34a' }]}>الأرباح</Text><Text style={[styles.profitGridValue, { color: '#16a34a' }]}>{fmt(monthlyData.partsProfit)} ل.س</Text><Text style={[styles.profitGridUSD, { color: '#16a34a' }]}>{fmtUSD(monthlyData.partsProfit)}</Text></View>
                <View style={[styles.profitGridItem, { backgroundColor: '#fee2e2' }]}><Text style={[styles.profitGridLabel, { color: '#dc2626' }]}>الخسائر</Text><Text style={[styles.profitGridValue, { color: '#dc2626' }]}>{fmt(monthlyData.totalPartsLoss)} ل.س</Text><Text style={[styles.profitGridUSD, { color: '#dc2626' }]}>{fmtUSD(monthlyData.totalPartsLoss)}</Text></View>
                <View style={[styles.profitGridItem, { backgroundColor: monthlyData.netPartsProfit >= 0 ? '#dbeafe' : '#fee2e2' }]}><Text style={[styles.profitGridLabel, { color: monthlyData.netPartsProfit >= 0 ? '#2563eb' : '#dc2626' }]}>الصافي</Text><Text style={[styles.profitGridValue, { color: monthlyData.netPartsProfit >= 0 ? '#2563eb' : '#dc2626' }]}>{fmt(monthlyData.netPartsProfit)} ل.س</Text><Text style={[styles.profitGridUSD, { color: monthlyData.netPartsProfit >= 0 ? '#2563eb' : '#dc2626' }]}>{fmtUSD(monthlyData.netPartsProfit)}</Text></View>
              </View>
            </View>

            {/* Tools Profit */}
            <View style={styles.profitCard}>
              <View style={styles.profitCardHeader}><Text style={styles.profitCardIcon}>🖥️</Text><Text style={styles.profitCardTitle}>صافي أرباح الأدوات</Text></View>
              <View style={styles.profitGrid}>
                <View style={[styles.profitGridItem, { backgroundColor: '#dcfce7' }]}><Text style={[styles.profitGridLabel, { color: '#16a34a' }]}>الأرباح</Text><Text style={[styles.profitGridValue, { color: '#16a34a' }]}>{fmt(monthlyData.toolsProfit)} ل.س</Text><Text style={[styles.profitGridUSD, { color: '#16a34a' }]}>{fmtUSD(monthlyData.toolsProfit)}</Text></View>
                <View style={[styles.profitGridItem, { backgroundColor: '#fee2e2' }]}><Text style={[styles.profitGridLabel, { color: '#dc2626' }]}>الخسائر</Text><Text style={[styles.profitGridValue, { color: '#dc2626' }]}>{fmt(monthlyData.totalToolsLoss)} ل.س</Text><Text style={[styles.profitGridUSD, { color: '#dc2626' }]}>{fmtUSD(monthlyData.totalToolsLoss)}</Text></View>
                <View style={[styles.profitGridItem, { backgroundColor: monthlyData.netToolsProfit >= 0 ? '#dbeafe' : '#fee2e2' }]}><Text style={[styles.profitGridLabel, { color: monthlyData.netToolsProfit >= 0 ? '#2563eb' : '#dc2626' }]}>الصافي</Text><Text style={[styles.profitGridValue, { color: monthlyData.netToolsProfit >= 0 ? '#2563eb' : '#dc2626' }]}>{fmt(monthlyData.netToolsProfit)} ل.س</Text><Text style={[styles.profitGridUSD, { color: monthlyData.netToolsProfit >= 0 ? '#2563eb' : '#dc2626' }]}>{fmtUSD(monthlyData.netToolsProfit)}</Text></View>
              </View>
            </View>

            {/* Total Net */}
            <View style={[styles.netProfitCard, { backgroundColor: monthlyData.totalNet >= 0 ? '#10b981' : '#dc2626' }]}>
              <Text style={styles.netProfitTitle}>📊 المجموع الكلي - {getMonthLabel(selectedMonth)}</Text>
              <View style={styles.netProfitRow}>
                <View style={styles.netProfitItem}><Text style={styles.netProfitLabel}>الليرة</Text><Text style={styles.netProfitValue}>{fmt(monthlyData.totalNet)} ل.س</Text></View>
                <View style={styles.netProfitItem}><Text style={styles.netProfitLabel}>الدولار</Text><Text style={styles.netProfitValue}>{fmtUSD(monthlyData.totalNet)}</Text></View>
              </View>
              <Text style={styles.netProfitCount}>عدد المبيعات: {monthlyData.soldCount}</Text>
            </View>
          </ScrollView>
        )}

        {/* Log Tab */}
        {activeTab === 'log' && (
          <FlatList data={logs} renderItem={renderLogItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.logList} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>لا يوجد سجل</Text></View>} />
        )}

        {/* Footer with BY ELIAS AJEEB */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerBrand}>BY ELIAS AJEEP</Text>
            <View style={styles.footerDecor}>
              <View style={styles.decorBox} /><View style={styles.decorBox} /><View style={styles.decorBox} /><View style={styles.decorBox} /><View style={styles.decorBox} />
            </View>
            <Text style={styles.footerTitle}>إلكترونيات النعمان</Text>
          </View>
        </View>

        {/* Settings Modal */}
        <Modal visible={showSettings} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>⚙️ الإعدادات</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
              </View>

              {/* Dark Mode Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>🌙 الوضع الليلي</Text>
                  <Text style={styles.settingDesc}>تبديل بين الوضع الفاتح والداكن</Text>
                </View>
                <Switch value={isDarkMode} onValueChange={onToggleDarkMode} trackColor={{ false: '#e2e8f0', true: '#6366f1' }} thumbColor="#ffffff" />
              </View>

              {/* Export */}
              <TouchableOpacity style={styles.settingBtn} onPress={() => { handleShare(); setShowSettings(false); }}>
                <Text style={styles.settingBtnText}>📤 تصدير ومشاركة البيانات</Text>
              </TouchableOpacity>

              {/* Import */}
              <TouchableOpacity style={styles.settingBtn} onPress={() => {
                setShowSettings(false);
                Alert.prompt('استيراد البيانات', 'الصق بيانات JSON', (text) => {
                  if (text && onImportData(text)) {
                    Alert.alert('✅', 'تم استيراد البيانات بنجاح');
                  } else if (text) {
                    Alert.alert('❌', 'فشل استيراد البيانات');
                  }
                });
              }}>
                <Text style={styles.settingBtnText}>📥 استيراد البيانات</Text>
              </TouchableOpacity>

              {/* Clear Data */}
              <TouchableOpacity style={styles.settingBtn} onPress={() => {
                Alert.alert('حذف كل البيانات', 'هل أنت متأكد؟', [
                  { text: 'إلغاء', style: 'cancel' },
                  { text: 'حذف', style: 'destructive', onPress: () => { onClearAll(); setShowSettings(false); } },
                ]);
              }}>
                <Text style={styles.settingBtnText}>🗑️ حذف كل البيانات</Text>
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity style={styles.settingBtn} onPress={() => {
                Alert.alert('تسجيل خروج', 'هل أنت متأكد من تسجيل الخروج؟', [
                  { text: 'إلغاء', style: 'cancel' },
                  { text: 'خروج', style: 'destructive', onPress: () => { onLogout(); } },
                ]);
              }}>
                <Text style={styles.settingBtnText}>🚪 تسجيل خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userSection: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 48, height: 48, backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userAvatarText: { fontSize: 24 },
  userInfo: { flex: 1 },
  userGreeting: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  userStatus: { fontSize: 12, color: COLORS.blueMuted },
  settingsButton: { width: 44, height: 44, backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  settingsButtonText: { fontSize: 20 },
  balanceSection: { marginBottom: 20 },
  balanceLabel: { fontSize: 12, color: COLORS.blueMuted, marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginBottom: 4 },
  balanceChange: { fontSize: 14 },
  exchangeButton: { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 12, alignItems: 'center', marginBottom: 12 },
  exchangeButtonText: { color: COLORS.white, fontSize: 14 },
  rateEdit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rateInput: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, width: 120, textAlign: 'center', color: '#1e293b' },
  rateSaveButton: { backgroundColor: COLORS.green, borderRadius: 8, padding: 8 },
  rateSaveText: { color: '#fff', fontWeight: 'bold' },
  rateCancelButton: { backgroundColor: '#64748b', borderRadius: 8, padding: 8 },
  rateCancelText: { color: '#fff', fontWeight: 'bold' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, marginHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 16 },
  tabActive: { backgroundColor: 'rgba(212, 175, 55, 0.2)', borderWidth: 1, borderColor: COLORS.gold },
  tabIcon: { fontSize: 20, marginBottom: 4 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: COLORS.blueMuted },
  tabLabelActive: { color: COLORS.white },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 16, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: COLORS.blueMuted, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  statValueGreen: { color: COLORS.green },
  statValueRed: { color: COLORS.red },
  balanceCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 16, padding: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
  balanceClose: { fontSize: 16, color: COLORS.blueMuted },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
  balanceItem: { alignItems: 'center' },
  balanceValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.cardBg },
  searchIcon: { fontSize: 16, marginRight: 8, color: COLORS.blueMuted },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.white },
  balanceToggle: { borderRadius: 12, padding: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  balanceToggleText: { fontSize: 18 },
  filtersContainer: { marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, backgroundColor: COLORS.cardBg },
  filterTitle: { fontSize: 14, fontWeight: '600', color: COLORS.white, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterInput: { flex: 1, padding: 10, borderRadius: 8, fontSize: 14, backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.white },
  clearFiltersBtn: { padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.blue },
  clearFiltersText: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  card: { borderRadius: 20, padding: 14, marginBottom: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  productDate: { fontSize: 13, marginTop: 2, color: COLORS.blueMuted },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stockOk: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  stockLow: { backgroundColor: 'rgba(217, 119, 6, 0.2)' },
  stockOut: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  stockText: { fontSize: 12, fontWeight: '600', color: COLORS.white },
  stockTextLow: { color: '#d97706' },
  stockTextOut: { color: '#dc2626' },
  priceRow: { flexDirection: 'row', gap: 8 },
  priceBox: { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  priceLabel: { fontSize: 10, marginBottom: 2, color: COLORS.blueMuted },
  priceUSD: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
  priceSYP: { fontSize: 10, color: COLORS.blueMuted },
  priceLabelWhite: { fontSize: 10, marginBottom: 2, color: 'rgba(255,255,255,0.8)' },
  priceUSDWhite: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  priceSYPWhite: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  profitBox: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  lossBox: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '500', color: COLORS.blueMuted },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  fabText: { fontSize: 28, color: '#000', fontWeight: '300' },
  profitsContainer: { flex: 1, padding: 16 },
  monthSelector: { borderRadius: 16, padding: 12, marginBottom: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  monthSelectorRow: { flexDirection: 'row', alignItems: 'center' },
  monthLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.white, marginRight: 8 },
  monthsScroll: { flex: 1 },
  monthBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  monthBtnActive: { backgroundColor: 'rgba(212, 175, 55, 0.3)', borderWidth: 1, borderColor: COLORS.gold },
  monthBtnText: { fontSize: 12, color: COLORS.blueMuted },
  monthBtnTextActive: { color: COLORS.white, fontWeight: 'bold' },
  newMonthBtn: { backgroundColor: '#10b981', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  newMonthBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  profitCard: { borderRadius: 16, padding: 14, marginBottom: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  profitCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profitCardIcon: { fontSize: 24, marginRight: 8 },
  profitCardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  profitGrid: { flexDirection: 'row', gap: 8 },
  profitGridItem: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  profitGridLabel: { fontSize: 11, marginBottom: 4 },
  profitGridValue: { fontSize: 14, fontWeight: 'bold' },
  profitGridUSD: { fontSize: 11 },
  netProfitCard: { borderRadius: 16, padding: 16, marginTop: 8 },
  netProfitTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 12 },
  netProfitRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  netProfitItem: { alignItems: 'center' },
  netProfitLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  netProfitValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  netProfitCount: { textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  logList: { padding: 16, paddingBottom: 100 },
  logItem: { borderRadius: 12, padding: 12, marginBottom: 8 },
  logHeader: { marginBottom: 6 },
  logHeaderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  logAction: { fontSize: 13, fontWeight: 'bold' },
  categoryBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  categoryText: { fontSize: 11, fontWeight: '600' },
  userBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: COLORS.gold },
  userBadgeText: { fontSize: 11, fontWeight: '600', color: '#000' },
  logTime: { fontSize: 12, color: '#94a3b8' },
  logProduct: { fontSize: 14, fontWeight: '600', color: '#4f46e5', marginBottom: 2 },
  logQty: { fontSize: 12, color: '#64748b' },
  logProfit: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  logLoss: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  footer: { paddingVertical: 10, alignItems: 'center' },
  footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 },
  footerDecor: { flexDirection: 'row', gap: 8 },
  decorBox: { width: 16, height: 16, borderRadius: 4, backgroundColor: COLORS.gold },
  footerTitle: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  footerBrand: { fontSize: 14, fontWeight: '600', color: COLORS.gold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  modalClose: { fontSize: 20, color: COLORS.blueMuted },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  settingDesc: { fontSize: 12, marginTop: 2, color: COLORS.blueMuted },
  settingBtn: { borderRadius: 12, padding: 14, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.cardBorder },
  settingBtnText: { fontSize: 14, fontWeight: '600', textAlign: 'center', color: COLORS.white },
});
