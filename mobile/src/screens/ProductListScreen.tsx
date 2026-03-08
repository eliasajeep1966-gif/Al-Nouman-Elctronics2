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
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Product, TabId } from '../types';

type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: { category: 'parts' | 'tools' };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProductList'>;
  products: Product[];
  exchangeRate: number;
  logs: any[];
  losses: any[];
  onAdd: (name: string, quantity: number, originalPriceUSD: number, sellingPriceUSD: number, category: 'parts' | 'tools', specifications?: string) => void;
  onSell: (id: string) => void;
  onDelete: (id: string) => void;
  onLoss: (id: string) => void;
  onSetExchangeRate: (rate: number) => void;
  onClearAll: () => void;
  onExportData: () => string;
  onImportData: (json: string) => boolean;
};

// ألوان التبويبات (مثل الموقع)
const tabColors: Record<TabId, { active: string; bg: string; indicator: string }> = {
  parts:   { active: 'text-orange-600', bg: 'bg-orange-50', indicator: 'bg-orange-500' },
  tools:   { active: 'text-indigo-600', bg: 'bg-indigo-50', indicator: 'bg-indigo-500' },
  profits: { active: 'text-emerald-600', bg: 'bg-emerald-50', indicator: 'bg-emerald-500' },
  log:     { active: 'text-purple-600', bg: 'bg-purple-50', indicator: 'bg-purple-500' },
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'parts', label: 'قطع الغيار', icon: '⚙️' },
  { id: 'tools', label: 'الأدوات', icon: '🖥️' },
  { id: 'profits', label: 'الأرباح', icon: '📊' },
  { id: 'log', label: 'السجل', icon: '📋' },
];

export default function ProductListScreen({ 
  navigation, 
  products, 
  exchangeRate,
  logs,
  losses,
  onAdd,
  onSell,
  onDelete,
  onLoss,
  onSetExchangeRate,
  onClearAll,
  onExportData,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('parts');
  const [search, setSearch] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');

  // تصفية المنتجات حسب الفئة
  const categoryProducts = useMemo(() => {
    if (activeTab === 'parts') return products.filter(p => p.category === 'parts');
    if (activeTab === 'tools') return products.filter(p => p.category === 'tools');
    return [];
  }, [products, activeTab]);

  // البحث
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return categoryProducts;
    const q = search.trim().toLowerCase();
    return categoryProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [categoryProducts, search]);

  // حساب الإحصائيات
  const totalProducts = categoryProducts.length;
  const totalItems = categoryProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalProfit = categoryProducts.reduce((sum, p) => 
    sum + (p.sellingPrice - p.originalPrice) * p.quantity, 0
  );
  const totalProfitUSD = totalProfit / exchangeRate;
  const totalCost = categoryProducts.reduce((sum, p) => 
    sum + p.originalPrice * p.quantity, 0
  );
  const totalCostUSD = totalCost / exchangeRate;

  // حساب أرباح الشهر الحالي
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyLosses = losses.filter(l => l.month === currentMonth);
  const monthlyLossAmount = monthlyLosses.reduce((sum, l) => sum + (l.amount || 0), 0);
  const monthlyLossUSD = monthlyLossAmount / exchangeRate;

  // أرباح المبيعات
  const soldItems = logs.filter(l => l.action === 'sold');
  const totalSalesProfit = soldItems.reduce((sum, l) => sum + (l.profit || 0), 0);
  const totalSalesProfitUSD = totalSalesProfit / exchangeRate;

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
      await Share.share({
        message: data,
        title: 'نسخ احتياطي - إلكترونيات النعمان',
      });
    } catch (error) {
      Alert.alert('خطأ', 'فشل في المشاركة');
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const profit = item.sellingPrice - item.originalPrice;
    const profitPercent = item.originalPrice > 0 
      ? ((profit / item.originalPrice) * 100).toFixed(1) 
      : '0';
    
    const originalUSD = item.originalPriceUSD ?? (item.originalPrice / exchangeRate);
    const sellingUSD = item.sellingPriceUSD ?? (item.sellingPrice / exchangeRate);
    const profitUSD = sellingUSD - originalUSD;

    const isOutOfStock = item.quantity === 0;
    const isLowStock = item.quantity > 0 && item.quantity <= 3;

    return (
      <TouchableOpacity
        style={[styles.card, isOutOfStock && styles.cardOutOfStock]}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productDate}>{item.createdAt}</Text>
          </View>
          <View style={[
            styles.stockBadge,
            isOutOfStock && styles.stockOut,
            isLowStock && styles.stockLow,
            !isOutOfStock && !isLowStock && styles.stockOk,
          ]}>
            <Text style={[
              styles.stockText,
              isOutOfStock && styles.stockTextOut,
              isLowStock && styles.stockTextLow,
            ]}>
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
          <View style={[styles.priceBox, styles.priceBoxPrimary]}>
            <Text style={styles.priceLabelWhite}>سعر البيع</Text>
            <Text style={styles.priceUSDWhite}>${sellingUSD.toFixed(2)}</Text>
            <Text style={styles.priceSYPWhite}>{item.sellingPrice.toLocaleString('en-US')} ل.س</Text>
          </View>
          <View style={[
            styles.priceBox,
            profit >= 0 ? styles.profitBox : styles.lossBox
          ]}>
            <Text style={styles.priceLabel}>الربح</Text>
            <Text style={[styles.priceUSD, profit >= 0 ? styles.profitText : styles.lossText]}>
              {profitUSD >= 0 ? '+' : ''}${profitUSD.toFixed(2)}
            </Text>
            <Text style={[styles.priceSYP, profit >= 0 ? styles.profitText : styles.lossText]}>
              {profitPercent}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLogItem = ({ item }: { item: any }) => {
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

    return (
      <View style={[styles.logItem, { backgroundColor: colors.bg }]}>
        <View style={styles.logHeader}>
          <Text style={[styles.logAction, { color: colors.text }]}>
            {actionLabels[item.action] || item.action}
          </Text>
          <Text style={styles.logTime}>{item.timestamp}</Text>
        </View>
        <Text style={styles.logProduct}>{item.productName}</Text>
        {item.quantity && (
          <Text style={styles.logQty}>الكمية: {item.quantity}</Text>
        )}
        {item.profit !== undefined && item.profit > 0 && (
          <Text style={[styles.logProfit, { color: '#16a34a' }]}>
            💵 ربح: {item.profit.toLocaleString('en-US')} ل.س
          </Text>
        )}
        {item.lossAmount !== undefined && (
          <Text style={[styles.logLoss, { color: '#d97706' }]}>
            📉 خسارة: {item.lossAmount.toLocaleString('en-US')} ل.س
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>⚡</Text>
        </View>
        <Text style={styles.headerTitle}>إلكترونيات النعمان</Text>
        
        {/* Exchange Rate Button */}
        <TouchableOpacity 
          style={styles.rateButton}
          onPress={() => {
            setRateInput(exchangeRate.toString());
            setEditingRate(true);
          }}
        >
          <Text style={styles.rateButtonText}>
            💵 {exchangeRate.toLocaleString('en-US')} ل.س/$
          </Text>
        </TouchableOpacity>

        {/* Edit Rate Modal */}
        {editingRate && (
          <View style={styles.rateEdit}>
            <TextInput
              style={styles.rateInput}
              value={rateInput}
              onChangeText={setRateInput}
              keyboardType="numeric"
              placeholder="سعر الصرف"
              autoFocus
            />
            <TouchableOpacity 
              style={styles.rateSaveButton}
              onPress={handleRateSubmit}
            >
              <Text style={styles.rateSaveText}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.rateCancelButton}
              onPress={() => setEditingRate(false)}
            >
              <Text style={styles.rateCancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Buttons */}
        <View style={styles.settingsRow}>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleShare}>
            <Text style={styles.settingsBtnText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsBtn} 
            onPress={() => {
              Alert.alert(
                'حذف كل البيانات',
                'هل أنت متأكد من حذف جميع البيانات؟',
                [
                  { text: 'إلغاء', style: 'cancel' },
                  { text: 'حذف', style: 'destructive', onPress: onClearAll },
                ]
              );
            }}
          >
            <Text style={styles.settingsBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive,
              activeTab === tab.id && {
                backgroundColor: tab.id === 'parts' ? '#fed7aa' :
                                tab.id === 'tools' ? '#c7d2fe' :
                                tab.id === 'profits' ? '#a7f3d0' : '#e9d5ff'
              }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parts/Tools Content */}
      {(activeTab === 'parts' || activeTab === 'tools') && (
        <>
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>المنتجات</Text>
              <Text style={styles.statValue}>{totalProducts}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>إجمالي القطع</Text>
              <Text style={[styles.statValue, styles.statValuePrimary]}>{totalItems}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>الربح المتوقع</Text>
              <Text style={[styles.statValue, totalProfit >= 0 ? styles.statValueGreen : styles.statValueRed]}>
                ${totalProfitUSD.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Balance Card */}
          {showBalance && (
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceTitle}>💰 الرصيد (مجموع المصاريف)</Text>
                <TouchableOpacity onPress={() => setShowBalance(false)}>
                  <Text style={styles.balanceClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>بالدولار</Text>
                  <Text style={styles.balanceValue}>${totalCostUSD.toFixed(2)}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>بالليرة</Text>
                  <Text style={styles.balanceValue}>{totalCost.toLocaleString('en-US')} ل.س</Text>
                </View>
              </View>
            </View>
          )}

          {/* Search + Actions Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={`البحث في ${activeTab === 'parts' ? 'قطع الغيار' : 'الأدوات'}...`}
                placeholderTextColor="#94a3b8"
              />
            </View>
            <TouchableOpacity 
              style={styles.balanceToggle}
              onPress={() => setShowBalance(!showBalance)}
            >
              <Text style={styles.balanceToggleText}>💰</Text>
            </TouchableOpacity>
          </View>

          {/* Products List */}
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا توجد منتجات</Text>
              <Text style={styles.emptySubtext}>أضف منتج جديد للبدء</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddProduct', { 
              category: activeTab === 'parts' ? 'parts' : 'tools' 
            })}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Profits Tab */}
      {activeTab === 'profits' && (
        <View style={styles.profitsContainer}>
          <View style={styles.profitCard}>
            <Text style={styles.profitCardTitle}>📈 إجمالي أرباح المبيعات</Text>
            <Text style={styles.profitCardValue}>${totalSalesProfitUSD.toFixed(2)}</Text>
            <Text style={styles.profitCardSYP}>{totalSalesProfit.toLocaleString('en-US')} ل.س</Text>
          </View>

          <View style={styles.lossCard}>
            <Text style={styles.lossCardTitle}>📉 إجمالي الخسائر</Text>
            <Text style={styles.lossCardValue}>${monthlyLossUSD.toFixed(2)}</Text>
            <Text style={styles.lossCardSYP}>{monthlyLossAmount.toLocaleString('en-US')} ل.س</Text>
          </View>

          <View style={styles.netProfitCard}>
            <Text style={styles.netProfitTitle}>💵 الربح الصافي</Text>
            <Text style={[
              styles.netProfitValue,
              (totalSalesProfit - monthlyLossAmount) >= 0 ? styles.netProfitGreen : styles.netProfitRed
            ]}>
              ${(totalSalesProfitUSD - monthlyLossUSD).toFixed(2)}
            </Text>
            <Text style={[
              styles.netProfitSYP,
              (totalSalesProfit - monthlyLossAmount) >= 0 ? styles.netProfitGreen : styles.netProfitRed
            ]}>
              {(totalSalesProfit - monthlyLossAmount).toLocaleString('en-US')} ل.س
            </Text>
          </View>
        </View>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.logList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا يوجد سجل</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerIconText: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  rateButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  rateEdit: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  rateInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  rateSaveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rateSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
  rateCancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rateCancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#e2e8f0',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#1e293b',
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statValuePrimary: {
    color: '#4f46e5',
  },
  statValueGreen: {
    color: '#10b981',
  },
  statValueRed: {
    color: '#ef4444',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    padding: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  balanceClose: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#ddd',
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  balanceToggle: {
    width: 46,
    height: 46,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceToggleText: {
    fontSize: 20,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardOutOfStock: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    paddingBottom: 0,
  },
  cardInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  productDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  stockOk: {
    backgroundColor: '#dcfce7',
  },
  stockLow: {
    backgroundColor: '#fef3c7',
  },
  stockOut: {
    backgroundColor: '#fee2e2',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockTextOut: {
    color: '#dc2626',
  },
  stockTextLow: {
    color: '#d97706',
  },
  priceRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  priceBoxPrimary: {
    backgroundColor: '#4f46e5',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  priceLabelWhite: {
    fontSize: 10,
    color: '#c7d2fe',
    marginBottom: 2,
  },
  priceUSD: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  priceUSDWhite: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceSYP: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  priceSYPWhite: {
    fontSize: 10,
    color: '#c7d2fe',
    marginTop: 2,
  },
  profitBox: {
    backgroundColor: '#dcfce7',
  },
  lossBox: {
    backgroundColor: '#fee2e2',
  },
  profitText: {
    color: '#16a34a',
  },
  lossText: {
    color: '#dc2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 36,
  },
  profitsContainer: {
    flex: 1,
    padding: 16,
  },
  profitCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  profitCardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  profitCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  profitCardSYP: {
    fontSize: 16,
    color: '#15803d',
    marginTop: 4,
  },
  lossCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  lossCardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  lossCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  lossCardSYP: {
    fontSize: 16,
    color: '#b91c1c',
    marginTop: 4,
  },
  netProfitCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  netProfitTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  netProfitValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  netProfitSYP: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  netProfitGreen: {
    color: '#16a34a',
  },
  netProfitRed: {
    color: '#dc2626',
  },
  logList: {
    padding: 16,
    paddingBottom: 40,
  },
  logItem: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 11,
    color: '#64748b',
  },
  logProduct: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  logQty: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logProfit: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  logLoss: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
