import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  Share,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Product, TabId, LogEntry, LossEntry } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
const { width } = Dimensions.get('window');

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

function getMonthLabel(month: string): string {
  if (!month) return '';
  const parts = month.split('-');
  if (parts.length < 2) return '';
  const [year, m] = parts;
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-SY', { month: 'long', year: 'numeric' }) || '';
}

export default function ProductListScreen({ 
  navigation, 
  products, 
  exchangeRate,
  logs,
  losses,
  onSetExchangeRate,
  onClearAll,
  onExportData,
  onImportData,
  userEmail,
  onLogout,
  isOnline,
}: Props) {
  
  const username = userEmail ? userEmail.split('@')[0] : 'المستخدم';
  
  const [activeTab, setActiveTab] = useState<TabId>('parts');
  const [search, setSearch] = useState('');
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRate.toString());
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinQuantity, setFilterMinQuantity] = useState('');
  const [filterMaxQuantity, setFilterMaxQuantity] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(() => {
   
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // دالة مساعدة قوية لاستخراج السنة والشهر لتفادي أخطاء التنسيق في الجوال
  const extractYearMonth = (timestamp: string) => {
    if (!timestamp) return null;
    const parts = timestamp.split('/');
    if (parts.length >= 3) {
      // سحب السنة بشكل إجباري لتفادي مشكلة المسافات أو الفواصل
      const yearMatch = parts[2].match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : parts[2].substring(0, 4);
      const month = parts[1].padStart(2, '0');
      return `${year}-${month}`;
    }
    return null;
  };

  const categoryProducts = useMemo(() => {
    if (activeTab === 'parts') return products.filter(p => p.category === 'parts');
    if (activeTab === 'tools') return products.filter(p => p.category === 'tools');
    return [];
  }, [products, activeTab]);

  const filteredProducts = useMemo(() => {
    let result = categoryProducts;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    if (filterMinPrice.trim()) {
      const minPrice = parseFloat(filterMinPrice);
      if (!isNaN(minPrice)) result = result.filter(p => p.sellingPrice >= minPrice);
    }
    if (filterMaxPrice.trim()) {
      const maxPrice = parseFloat(filterMaxPrice);
      if (!isNaN(maxPrice)) result = result.filter(p => p.sellingPrice <= maxPrice);
    }
    if (filterMinQuantity.trim()) {
      const minQty = parseInt(filterMinQuantity);
      if (!isNaN(minQty)) result = result.filter(p => p.quantity >= minQty);
    }
    if (filterMaxQuantity.trim()) {
      const maxQty = parseInt(filterMaxQuantity);
      if (!isNaN(maxQty)) result = result.filter(p => p.quantity <= maxQty);
    }
    return result;
  }, [categoryProducts, search, filterMinPrice, filterMaxPrice, filterMinQuantity, filterMaxQuantity]);

  const totalProducts = categoryProducts.length;
  const totalItems = categoryProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalProfit = categoryProducts.reduce((sum, p) => sum + (p.sellingPrice - p.originalPrice) * p.quantity, 0);
  const totalProfitUSD = totalProfit / exchangeRate;

  // الحسابات المحدثة لتعمل بكفاءة دون أخطاء
  const monthlyData = useMemo(() => {
    const soldLogs = logs.filter(log => {
      if (log.action !== 'sold') return false;
      const ym = extractYearMonth(log.timestamp);
      return ym === selectedMonth;
    });

    const partsProfit = soldLogs.filter(l => l.category === 'parts').reduce((sum, l) => sum + (l.profit || 0), 0);
    const toolsProfit = soldLogs.filter(l => l.category === 'tools').reduce((sum, l) => sum + (l.profit || 0), 0);
    
    const monthLosses = losses.filter(l => l.month === selectedMonth);
    const totalPartsLoss = monthLosses.filter(l => l.category === 'parts').reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalToolsLoss = monthLosses.filter(l => l.category === 'tools').reduce((sum, l) => sum + (l.amount || 0), 0);

    return {
      partsProfit,
      toolsProfit,
      totalPartsLoss,
      totalToolsLoss,
      netPartsProfit: partsProfit - totalPartsLoss,
      netToolsProfit: toolsProfit - totalToolsLoss,
      totalNet: (partsProfit - totalPartsLoss) + (toolsProfit - totalToolsLoss),
      soldCount: soldLogs.length,
    };
  }, [logs, losses, selectedMonth]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonth);
    
    logs.forEach(log => {
      if (log.action === 'sold' && log.timestamp) {
        const ym = extractYearMonth(log.timestamp);
        if (ym) months.add(ym);
      }
    });
    losses.forEach(l => { if (l.month) months.add(l.month); });
    return Array.from(months).sort().reverse();
  }, [logs, losses]);

  const handleShare = async () => {
    try {
      const data = onExportData();
      await Share.share({ message: data, title: 'نسخ احتياطي - إلكترونيات النعمان' });
    } catch (error) {
      Alert.alert('خطأ', 'فشل في المشاركة');
    }
  };

  const fmt = (n: number) => (n || 0).toLocaleString('en-US');
  const fmtUSD = (n: number) => `$${((n || 0) / exchangeRate).toFixed(2)}`;

 const renderProduct = ({ item }: { item: Product }) => {
    const originalUSD = item.originalPriceUSD ?? (item.originalPrice / exchangeRate);
    const sellingUSD = item.sellingPriceUSD ?? (item.sellingPrice / exchangeRate);
    
    // تحويل الأسعار لليرة السورية بناءً على السعر المدخل فوق
    const originalSYP = originalUSD * exchangeRate;
    const sellingSYP = sellingUSD * exchangeRate;

    const isOutOfStock = item.quantity === 0;
    const isLowStock = item.quantity > 0 && item.quantity <= 4;

    return (
      <TouchableOpacity 
        style={[styles.cardContainer, isOutOfStock && { opacity: 0.8 }]}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <BlurView intensity={25} tint="dark" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName}>{item.name}</Text>
            
            {/* عرض حالة المخزون بالألوان المطلوبة */}
            <View style={[
              styles.stockBadge, 
              isOutOfStock ? styles.stockRed : (isLowStock ? styles.stockYellow : styles.stockGreen)
            ]}>
              <Text style={styles.stockText}>
                {isOutOfStock ? 'نفاد الكمية' : (isLowStock ? `منخفض: ${item.quantity}` : `متوفر: ${item.quantity}`)}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            {/* سعر الشراء */}
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>شراء </Text>
              <Text style={styles.priceValueUSD}>${originalUSD.toFixed(2)}</Text>
              <Text style={styles.priceValueSYP}>{fmt(originalSYP)} ل.س</Text>
            </View>

            {/* سعر البيع */}
            <View style={[styles.priceBox, { backgroundColor: 'rgba(0, 100, 255, 0.1)' }]}>
              <Text style={styles.priceLabel}>بيع </Text>
              <Text style={[styles.priceValueUSD, { color: '#60a5fa' }]}>${sellingUSD.toFixed(2)}</Text>
              <Text style={styles.priceValueSYP}>{fmt(sellingSYP)} ل.س</Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => {
    const actionLabels: Record<string, string> = {
      added: '➕ أضيف', sold: '💰 بيع', loss: '📉 خسارة', deleted: '🗑️ حذف',
    };
    
    return (
      <View style={styles.cardContainer}>
        <BlurView intensity={20} tint="dark" style={styles.glassCard}>
          <View style={styles.logHeaderTop}>
            <Text style={[styles.logAction, { color: item.action === 'sold' ? '#60a5fa' : (item.action === 'loss' ? '#f87171' : '#D4AF37') }]}>
              {actionLabels[item.action] || item.action}
            </Text>
            <Text style={styles.logTime}>{item.timestamp}</Text>
          </View>
          <Text style={styles.logProduct}>{item.productName}</Text>
          {item.quantity && <Text style={styles.logQty}>الكمية: {item.quantity}</Text>}
          {item.profit != null && item.profit > 0 && (
            <Text style={[styles.logProfit, { color: '#4ade80' }]}>💵 ربح: {fmt(item.profit)} ل.س</Text>
          )}
          {item.lossAmount != null && (
            <Text style={[styles.logLoss, { color: '#f87171' }]}>📉 خسارة: {fmt(item.lossAmount)} ل.س</Text>
          )}
        </BlurView>
      </View>
    );
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#000B26', '#001a63']} style={StyleSheet.absoluteFill} />
      <Image 
        source={require('../../assets/logo.png')} 
        style={styles.watermarkBg}
        resizeMode="contain"
        alt=""
      />

      <SafeAreaView style={{ flex: 1 }}>
        
        <View style={styles.topHeader}>
          <View style={styles.brandInfo}>
             <Image source={require('../../assets/logo.png')} style={styles.headerLogo} alt="شعار إلكترونيات النعمان" />
             <Text style={styles.brandTitleText}>إلكترونيات النعمان</Text>
          </View>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={{ marginRight: 15 }}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>
            <Text style={styles.userNick}>@{username}</Text>
            <View style={styles.avatarContainer}>
              <View style={styles.dummyAvatar}><Text style={{fontSize: 12}}>👤</Text></View>
              <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <BlurView intensity={15} style={styles.searchWrapper}>
            <TextInput 
              style={styles.inputSearch} 
              placeholder="البحث..." 
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </BlurView>
          
          <TouchableOpacity style={styles.filterChip} onPress={() => setShowFilters(!showFilters)}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rateChip} onPress={() => { setRateInput(exchangeRate.toString()); setEditingRate(true); }}>
            <Text style={styles.rateVal}>💵 {exchangeRate.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={{ marginHorizontal: 16, marginBottom: 10, borderRadius: 12, overflow: 'hidden' }}>
            <BlurView intensity={30} tint="dark" style={{ padding: 12 }}>
              <Text style={{ color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>فلترة متقدمة:</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput style={styles.filterInput} value={filterMinPrice} onChangeText={setFilterMinPrice} placeholder="السعر من" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                <TextInput style={styles.filterInput} value={filterMaxPrice} onChangeText={setFilterMaxPrice} placeholder="السعر إلى" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput style={styles.filterInput} value={filterMinQuantity} onChangeText={setFilterMinQuantity} placeholder="الكمية من" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                <TextInput style={styles.filterInput} value={filterMaxQuantity} onChangeText={setFilterMaxQuantity} placeholder="الكمية إلى" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
              </View>
              <TouchableOpacity style={{ backgroundColor: '#D4AF37', padding: 8, borderRadius: 8, alignItems: 'center' }} onPress={() => { setFilterMinPrice(''); setFilterMaxPrice(''); setFilterMinQuantity(''); setFilterMaxQuantity(''); }}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>مسح الفلاتر</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        )}

        {(activeTab === 'parts' || activeTab === 'tools') && (
          <>
            <View style={{ marginHorizontal: 16, marginBottom: 10, borderRadius: 12, overflow: 'hidden' }}>
              <BlurView intensity={20} tint="dark" style={styles.statsBar}>
                <View style={styles.statItem}><Text style={styles.statLabel}>المنتجات </Text><Text style={styles.statValue}>{totalProducts}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>الكمية </Text><Text style={[styles.statValue, { color: '#60a5fa' }]}>{totalItems}</Text></View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>الربح </Text>
                  <Text style={[styles.statValue, totalProfit >= 0 ? { color: '#4ade80' } : { color: '#f87171' }]}>${totalProfitUSD.toFixed(0)}</Text>
                </View>
              </BlurView>
            </View>
            
            <FlatList 
              data={filteredProducts} 
              renderItem={renderProduct} 
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 110 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 20 }}>لا توجد منتجات</Text>}
            />
          </>
        )}

        {activeTab === 'profits' && (
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 110 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              <BlurView intensity={20} tint="dark" style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>الشهر:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} >
                    {availableMonths.map(month => (
                      <TouchableOpacity key={month} style={[styles.monthBtn, selectedMonth === month && { backgroundColor: '#D4AF37' }]} onPress={() => setSelectedMonth(month)}>
                        <Text style={[styles.monthBtnText, selectedMonth === month && { color: '#000', fontWeight: 'bold' }]}>{getMonthLabel(month)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </BlurView>
            </View>

            {['parts', 'tools'].map((cat) => {
              const isParts = cat === 'parts';
              const profit = isParts ? monthlyData.partsProfit : monthlyData.toolsProfit;
              const loss = isParts ? monthlyData.totalPartsLoss : monthlyData.totalToolsLoss;
              const net = isParts ? monthlyData.netPartsProfit : monthlyData.netToolsProfit;
              
              return (
                <View key={cat} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                  <BlurView intensity={25} tint="dark" style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 24, marginLeft: 8 }}>{isParts ? '⚙️' : '🖥️'}</Text>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>صافي أرباح {isParts ? 'قطع الغيار' : 'الأدوات'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                      <View style={[styles.profitGridItem, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}><Text style={[styles.profitGridLabel, { color: '#4ade80' }]}>الاربـــاح </Text><Text style={[styles.profitGridValue, { color: '#4ade80' }]}>{fmt(profit)} ل.س</Text></View>
                      <View style={[styles.profitGridItem, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}><Text style={[styles.profitGridLabel, { color: '#f87171' }]}>الخسائر </Text><Text style={[styles.profitGridValue, { color: '#f87171' }]}>{fmt(loss)} ل.س</Text></View>
                      <View style={[styles.profitGridItem, { backgroundColor: net >= 0 ? 'rgba(96, 165, 250, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}><Text style={[styles.profitGridLabel, { color: net >= 0 ? '#60a5fa' : '#f87171' }]}>الصافـــي  </Text><Text style={[styles.profitGridValue, { color: net >= 0 ? '#60a5fa' : '#f87171' }]}>{fmt(net)} ل.س</Text></View>
                    </View>
                  </BlurView>
                </View>
              );
            })}

            <LinearGradient colors={monthlyData.totalNet >= 0 ? ['#059669', '#047857'] : ['#dc2626', '#991b1b']} style={{ borderRadius: 16, padding: 16, marginTop: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 12 }}>📊 المجموع الكلي - {getMonthLabel(selectedMonth)}</Text>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginBottom: 8 }}>
                <View style={{ alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>الليرة</Text><Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>{fmt(monthlyData.totalNet)} ل.س</Text></View>
                <View style={{ alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>الدولار</Text><Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>{fmtUSD(monthlyData.totalNet)}</Text></View>
              </View>
              <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>عدد المبيعات: {monthlyData.soldCount}</Text>
            </LinearGradient>
          </ScrollView>
        )}

        {activeTab === 'log' && (
          <FlatList 
            data={logs} 
            renderItem={renderLogItem} 
            keyExtractor={(item) => item.id} 
            contentContainerStyle={{ paddingBottom: 110, paddingTop: 5 }} 
            showsVerticalScrollIndicator={false} 
            ListEmptyComponent={<Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 20 }}>لا يوجد سجل</Text>}
          />
        )}

        <View style={styles.bottomNavContainer}>
          <BlurView intensity={70} tint="dark" style={styles.navBarBlur}>
            <TouchableOpacity onPress={() => setActiveTab('parts')} style={styles.navBtn}>
              <Text style={[styles.navIcon, activeTab === 'parts' && styles.goldText]}>🛠️</Text>
              <Text style={[styles.navText, activeTab === 'parts' && styles.goldText]}>العناصر </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('tools')} style={styles.navBtn}>
              <Text style={[styles.navIcon, activeTab === 'tools' && styles.goldText]}>🖥️</Text>
              <Text style={[styles.navText, activeTab === 'tools' && styles.goldText]}>الأجهزة </Text>
            </TouchableOpacity>

            <View style={{ width: 75 }} /> 

            <TouchableOpacity onPress={() => setActiveTab('profits')} style={styles.navBtn}>
              <Text style={[styles.navIcon, activeTab === 'profits' && styles.goldText]}>📊</Text>
              <Text style={[styles.navText, activeTab === 'profits' && styles.goldText]}>الأرباح</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('log')} style={styles.navBtn}>
              <Text style={[styles.navIcon, activeTab === 'log' && styles.goldText]}>📋</Text>
              <Text style={[styles.navText, activeTab === 'log' && styles.goldText]}>السجل</Text>
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity 
            style={styles.floatingFab}
            onPress={() => navigation.navigate('AddProduct', { category: activeTab === 'parts' ? 'parts' : 'tools' })}
          >
            <LinearGradient colors={['#D4AF37', '#b8860b']} style={styles.fabGradientBg}>
              <Text style={styles.fabPlusSign}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={editingRate} transparent animationType="fade">
        <View style={styles.overlayFull}>
          <BlurView intensity={80} tint="dark" style={styles.modalBox}>
            <Text style={styles.modalLabel}>تحديث سعر الصرف</Text>
            <TextInput 
              style={styles.modalField} 
              keyboardType="numeric" 
              value={rateInput} 
              onChangeText={setRateInput}
            />
            <View style={styles.modalBtnRow}>
               <TouchableOpacity style={styles.btnSave} onPress={() => { onSetExchangeRate(parseFloat(rateInput)); setEditingRate(false); }}>
                 <Text style={{color: '#000', fontWeight: 'bold'}}>حفظ</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setEditingRate(false)}>
                 <Text style={{color: '#fff'}}>إلغاء</Text>
               </TouchableOpacity>
             </View>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.overlayFull}>
          <BlurView intensity={80} tint="dark" style={[styles.modalBox, { width: '90%' }]}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>⚙️ الإعدادات</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}><Text style={{ color: '#9CA3AF', fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.settingBtn} onPress={() => { handleShare(); setShowSettings(false); }}>
              <Text style={{ color: '#60a5fa', fontWeight: 'bold' }}>📤 تصدير ومشاركة البيانات</Text>
            </TouchableOpacity>

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
              <Text style={{ color: '#4ade80', fontWeight: 'bold' }}>📥 استيراد البيانات</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingBtn} onPress={() => {
              Alert.alert('حذف كل البيانات', 'هل أنت متأكد؟', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'حذف', style: 'destructive', onPress: () => { onClearAll(); setShowSettings(false); } },
              ]);
            }}>
              <Text style={{ color: '#f87171', fontWeight: 'bold' }}>🗑️ حذف كل البيانات</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingBtn, { borderBottomWidth: 0 }]} onPress={() => {
              Alert.alert('تسجيل خروج', 'هل أنت متأكد؟', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'خروج', style: 'destructive', onPress: () => { onLogout(); } },
              ]);
            }}>
              <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>🚪 تسجيل خروج</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  watermarkBg: { position: 'absolute', width: width * 1.3, height: width * 1.3, top: '12%', alignSelf: 'center', opacity: 0.05 },
  topHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  brandInfo: { flexDirection: 'row-reverse', alignItems: 'center' },
  headerLogo: { width: 34, height: 34, marginLeft: 10 },
  brandTitleText: { color: '#D4AF37', fontSize: 19, fontWeight: 'bold' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userNick: { color: '#fff', marginRight: 8, fontSize: 13 },
  avatarContainer: { width: 36, height: 36 },
  dummyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 5.5, borderWidth: 2, borderColor: '#000B26' },
  
  actionRow: { flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 10, marginVertical: 8 },
  searchWrapper: { flex: 1, height: 42, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center', overflow: 'hidden' },
  inputSearch: { color: '#fff', textAlign: 'right', fontSize: 14 },
  rateChip: { backgroundColor: 'rgba(212, 175, 55, 0.12)', paddingHorizontal: 12, borderRadius: 12, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)' },
  rateVal: { color: '#D4AF37', fontWeight: 'bold', fontSize: 13 },
  filterChip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, borderRadius: 12, justifyContent: 'center' },
  filterInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: 8, textAlign: 'right' },

  statsBar: { flexDirection: 'row-reverse', justifyContent: 'space-around', paddingVertical: 12 },
  statItem: { alignItems: 'center' },
  statLabel: { color: '#9CA3AF', fontSize: 11, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  cardContainer: { marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  glassCard: { padding: 14 },
  productName: { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 10, textAlign: 'right' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center'},
    stockGreen: { backgroundColor: '#22c55e' }, // مربع أخضر (متوفر)
  stockYellow: { backgroundColor: '#eab308' }, // مربع أصفر (منخفض)
  stockRed: { backgroundColor: '#ef4444' },    // مربع أحمر (خالص)
  stockOk: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  stockLow: { backgroundColor: 'rgba(239, 168, 68, 0.2)' },
  stockOut: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
stockText: { color: '#000', fontSize: 11, fontWeight: 'bold' },  
priceRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 10 },
  priceBox: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 10, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
priceLabel: { color: '#ffffff', fontSize: 15, marginBottom: 4 },  priceValueSYP: { color: '#bfe225', fontWeight: '700', fontSize: 13 },
 priceValueUSD: { color: '#5e91ee', fontWeight: 'bold', fontSize:20 },
 
monthBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  monthBtnText: { fontSize: 12, color: '#fff' },
  profitGridItem: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  profitGridLabel: { fontSize: 11, marginBottom: 4 },
  profitGridValue: { fontSize: 13, fontWeight: 'bold' },

  logHeaderTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  logAction: { fontSize: 13, fontWeight: 'bold' },
  logTime: { fontSize: 11, color: '#9CA3AF' },
  logProduct: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4, textAlign: 'right' },
  logQty: { color: '#9CA3AF', fontSize: 12, textAlign: 'right' },
  logProfit: { fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'right' },
  logLoss: { fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'right' },

bottomNavContainer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    height: 100, // زدنا الارتفاع الكلي
    justifyContent: 'flex-end' 
  },
  navBarBlur: { 
    flexDirection: 'row-reverse', // لترتيب العناصر من اليمين
    height: 80, // كبّرنا شريط التبويبات نفسه من 65 إلى 80
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    overflow: 'hidden', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    paddingBottom: 10 // مساحة إضافية من الأسفل
  },
  navBtn: { 
    alignItems: 'center', 
    flex: 1,
    paddingVertical: 10 // تكبير مساحة اللمس (Touch Target)
  },
  navIcon: { 
    fontSize: 26, // كبّرنا الأيقونة من 21 إلى 26
    color: '#6B7280',
    marginBottom: 4 
  },
  navText: { 
    fontSize: 13, // كبّرنا الخط من 9 إلى 13 ليكون مقروء بوضوح
    color: '#6B7280', 
    fontWeight: '600' // جعلنا الخط أسمك قليلاً
  },
  goldText: { 
    color: '#D4AF37',
    fontSize: 14, // تكبير بسيط للنص النشط
    fontWeight: 'bold'
  },
  floatingFab: { position: 'absolute', top: 0, alignSelf: 'center', width: 66, height: 66, borderRadius: 33, elevation: 8, shadowColor: '#D4AF37', shadowOpacity: 0.35, shadowRadius: 10 },
  fabGradientBg: { flex: 1, borderRadius: 33, justifyContent: 'center', alignItems: 'center' },
  fabPlusSign: { fontSize: 38, color: '#000', fontWeight: '200' },
  
  overlayFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)' },
  modalBox: { width: '85%', padding: 25, borderRadius: 20, overflow: 'hidden', alignItems: 'center' },
  modalLabel: { color: '#fff', fontSize: 17, marginBottom: 15 },
  modalField: { backgroundColor: '#fff', width: '100%', padding: 12, borderRadius: 10, textAlign: 'center', fontSize: 19, marginBottom: 15 },
  modalBtnRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 20 },
  btnSave: { backgroundColor: '#D4AF37', paddingVertical: 8, paddingHorizontal: 25, borderRadius: 8 },
  
  settingBtn: { width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }
});